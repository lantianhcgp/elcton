#!/usr/bin/env python3
"""Read-only Huawei public-source acquisition; no APKs, login, settings or ADB.
All output is confined to this script's directory. Only stdlib is used.
"""
import concurrent.futures
import datetime
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request

BASE = Path(__file__).resolve().parent
ENDPOINT = "https://svc-drcn.developer.huawei.com/community/servlet/consumer/cn/documentPortal/getDocumentById"

class TextParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.links = []
        self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "noscript"}:
            self.skip += 1
        if not self.skip and tag in {"h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "div", "tr", "br"}:
            self.parts.append("\n")
        if tag == "a":
            href = dict(attrs).get("href", "")
            if href:
                self.links.append(href)
    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript"} and self.skip:
            self.skip -= 1
        if not self.skip and tag in {"h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "div", "tr"}:
            self.parts.append("\n")
    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)
    def text(self):
        text = "".join(self.parts).replace("\xa0", " ")
        return re.sub(r"\n[ \t]*\n(?:[ \t]*\n)+", "\n\n", text).strip() + "\n"


def now():
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")


def acquire(spec):
    sid = spec["id"]
    meta = {"id": sid, "source_url": spec["url"], "retrieved_started": now(), "acquisition": "direct_origin_public_document_api" if "slug" in spec else "direct_origin_HTTPS_GET", "fresh_network_request": True, "no_authentication": True, "expected_title": spec["title"], "status": "failed"}
    try:
        headers = {"User-Agent": "Mozilla/5.0 (read-only public-source research)", "Accept": "application/json" if "slug" in spec else "text/html"}
        if "slug" in spec:
            if not re.fullmatch(r"[a-zA-Z0-9-]+-\d{10,}", spec["slug"]):
                raise ValueError("Invalid complete source slug; do not normalize")
            payload = {"objectId": spec["slug"], "language": spec["language"], "catalogName": spec["catalog"]}
            meta["api_endpoint"] = ENDPOINT
            meta["request_payload"] = payload
            headers["Content-Type"] = "application/json"
            req = urllib.request.Request(ENDPOINT, data=json.dumps(payload).encode("utf-8"), headers=headers)
        else:
            req = urllib.request.Request(spec["url"], headers=headers)
        with urllib.request.urlopen(req, timeout=45) as response:
            ctype = response.headers.get("Content-Type", "")
            if not ("html" in ctype.lower() or "json" in ctype.lower() or "text/" in ctype.lower()):
                raise ValueError("Rejected non-document response: " + ctype)
            raw = response.read()
            meta.update({"http_status": response.status, "final_request_url": response.geturl(), "content_type": ctype, "response_bytes": len(raw), "raw_sha256": hashlib.sha256(raw).hexdigest(), "response_headers": {k: ("[REDACTED anonymous response cookie]" if k.lower() in {"set-cookie", "cookie", "authorization", "proxy-authorization"} else v) for k, v in response.headers.items()}})
        if "slug" in spec:
            path = BASE / (sid + ".response.json")
            path.write_bytes(raw)
            meta["raw_file"] = str(path)
            data = json.loads(raw)
            value = data.get("value", {})
            body = value.get("content", {}).get("content", "") if isinstance(value, dict) else ""
            meta.update({"api_code": data.get("code"), "actual_title": value.get("title") if isinstance(value, dict) else None, "updatedDate": value.get("updatedDate") if isinstance(value, dict) else None, "displayUpdateTime": value.get("displayUpdateTime") if isinstance(value, dict) else None, "businessTypeName": value.get("businessTypeName") if isinstance(value, dict) else None})
            if data.get("code") != 0 or value.get("title") != spec["title"] or not isinstance(body, str) or not body.strip():
                raise ValueError("Document validation failed: code/title/nonempty body")
            body_path = BASE / (sid + ".body.html")
            body_path.write_text(body, encoding="utf-8")
            meta["body_file"] = str(body_path)
            meta["text_body_complete"] = bool(re.search(r"</html>\s*$", body, re.I))
            meta["completeness_note"] = "Complete nonempty HTML body from validated code=0 public document response; no local truncation. Embedded images referenced only, not fetched or visually reviewed. Display time and API update fields retained verbatim without inferred timezone."
        else:
            body = raw.decode("utf-8", errors="replace")
            path = BASE / (sid + ".page.html")
            path.write_bytes(raw)
            meta["raw_file"] = str(path)
            meta["body_file"] = str(path)
            meta["text_body_complete"] = bool(re.search(r"</html>\s*$", body, re.I))
            meta["completeness_note"] = "Entire HTTPS HTML response saved without local truncation; article text checked below. Navigation, scripts and image references remain in raw page; embedded images not fetched or visually reviewed."
        parser = TextParser()
        parser.feed(body)
        text = parser.text()
        if spec.get("must_contain") and not all(x in text for x in spec["must_contain"]):
            raise ValueError("Article validation failed: required original text not present")
        if "slug" not in spec and spec["title"] not in text:
            raise ValueError("Article title absent; likely shell or different source")
        text_path = BASE / (sid + ".text.txt")
        text_path.write_text(text, encoding="utf-8")
        links_path = BASE / (sid + ".links.json")
        links_path.write_text(json.dumps(list(dict.fromkeys(parser.links)), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        meta.update({"text_file": str(text_path), "links_file": str(links_path), "body_characters": len(body), "text_characters": len(text), "body_sha256": hashlib.sha256(body.encode("utf-8")).hexdigest(), "status": "success", "article_text_validated": True})
        if "slug" not in spec:
            meta["actual_title"] = spec["title"]
    except Exception as exc:
        meta["error"] = type(exc).__name__ + ": " + str(exc)
    meta["retrieved_finished"] = now()
    (BASE / (sid + ".meta.json")).write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return meta


def run(specs, manifest_name):
    BASE.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        results = list(pool.map(acquire, specs))
    (BASE / manifest_name).write_text(json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for r in results:
        print(r["id"] + " | " + r["status"] + " | " + str(r.get("actual_title", "")) + " | " + str(r.get("text_characters", 0)) + " chars" + (" | " + r["error"] if "error" in r else ""))
    return results


INITIAL = [
    {"id": "S01-wear-getting-started-en", "url": "https://developer.huawei.com/consumer/en/doc/connectivity-guides/dev-process-0000001051058039", "slug": "dev-process-0000001051058039", "language": "en", "catalog": "connectivity-Guides", "title": "Getting Started", "must_contain": ["For non-Huawei phones, HMS Core (APK) is also required", "Phone runs Android 6.0 or later"]},
    {"id": "S02-wear-getting-started-cn", "url": "https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/dev-process-0000001051058039", "slug": "dev-process-0000001051058039", "language": "cn", "catalog": "connectivity-Guides", "title": "使用入门"},
    {"id": "S03-wear-service-introduction-en", "url": "https://developer.huawei.com/consumer/en/doc/connectivity-Guides/service-introduction-0000000000018585", "slug": "service-introduction-0000000000018585", "language": "en", "catalog": "connectivity-Guides", "title": "Service Introduction"},
    {"id": "S04-wear-sdk-privacy-en", "url": "https://developer.huawei.com/consumer/en/doc/connectivity-Guides/sdk-data-security-0000000000019123", "slug": "sdk-data-security-0000000000019123", "language": "en", "catalog": "connectivity-Guides", "title": "SDK Privacy and Security Statement"},
    {"id": "S05-non-huawei-install-cn", "url": "https://consumer.huawei.com/cn/support/content/zh-cn15905145/", "title": "非华为品牌设备如何安装HMS Core", "must_contain": ["非华为的其他品牌安卓设备", "华为应用市场"]},
    {"id": "S06-hms-install-needed-en", "url": "https://consumer.huawei.com/en/support/content/en-us15841704/", "title": "A message is displayed indicating that HMS Core needs to be installed or updated when opening an app on a non-huawei phone", "must_contain": ["HUAWEI Health", "malware detection"]},
    {"id": "S07-hms-supported-devices-cn", "url": "https://consumer.huawei.com/cn/support/content/zh-cn15841699/", "title": "HMS Core（华为移动服务）适配哪些设备？设备如何安装下载？", "must_contain": ["其他品牌的安卓设备", "无需下载HMS Core"]},
    {"id": "S08-health-system-requirements-en", "url": "https://consumer.huawei.com/en/support/content/en-us15981770/", "title": "Downloading and updating the Huawei Health app", "must_contain": ["Android 8.0", "HMS Core"]},
    {"id": "S09-hms-introduction-en", "url": "https://consumer.huawei.com/en/support/content/en-us15841718/", "title": "Introduction to HMS Core", "must_contain": ["Android Open Source Project", "certain Android apps require support from GMS Core"]},
    {"id": "S10-hms-update-en", "url": "https://consumer.huawei.com/en/support/content/en-us15841698/", "title": "How to update HMS Core", "must_contain": ["For non-Huawei devices", "Auto-update over Wi-Fi"]},
    {"id": "S11-official-appgallery-link-cn", "url": "https://consumer.huawei.com/cn/support/content/zh-cn00749693/", "title": "非华为手机或平板登录智慧生活App失败", "must_contain": ["https://appgallery.huawei.com/", "HMS Core"]},
    {"id": "S12-xiaomi-health-battery-cn", "url": "https://consumer.huawei.com/cn/support/content/zh-cn15981195/", "title": "华为穿戴设备连接三方安卓手机，来电/消息提醒延迟很久", "must_contain": ["小米手机", "省电策略"]},
    {"id": "S13-xiaomi-health-lock-cn", "url": "https://consumer.huawei.com/cn/support/content/zh-cn15848663/", "title": "小米手机锁定后台任务", "must_contain": ["华为运动健康", "锁定"]},
    {"id": "S14-hms-manage-permissions-en", "url": "https://consumer.huawei.com/en/support/content/en-us15841709/", "title": "How to manage HMS Core", "must_contain": ["permissions and data usage", "Allow or Deny"]},
    {"id": "S15-appgallery-official-home", "url": "https://appgallery.huawei.com/", "title": "AppGallery", "must_contain": ["AppGallery"]},
]

if __name__ == "__main__":
    run(INITIAL, "capture-initial-manifest.json")
