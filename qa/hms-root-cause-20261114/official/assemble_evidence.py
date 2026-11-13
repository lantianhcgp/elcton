#!/usr/bin/env python3
"""Assemble a source ledger and verify captured Huawei source artifacts only."""
import datetime
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent

def source_file(value):
    # Source ledger retains original capture paths; verification uses sibling
    # filenames so a freshly fetched checkout is reproducible elsewhere.
    return BASE / Path(value).name

class RowParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.rows = []
        self.row = None
        self.cell = None
    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.row = []
        if tag in {"td", "th"} and self.row is not None:
            self.cell = []
    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)
    def handle_endtag(self, tag):
        if tag in {"td", "th"} and self.row is not None and self.cell is not None:
            self.row.append(" ".join("".join(self.cell).split()))
            self.cell = None
        if tag == "tr" and self.row is not None:
            self.rows.append(self.row)
            self.row = None


def main():
    metas = sorted((json.loads(p.read_text(encoding="utf-8")) for p in BASE.glob("*.meta.json")), key=lambda m: m["id"])
    success = [m for m in metas if m["status"] == "success"]
    failed = [m for m in metas if m["status"] != "success"]
    checks = []
    for m in success:
        raw = source_file(m["raw_file"]).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == m["raw_sha256"], m["id"]
        assert len(raw) == m["response_bytes"], m["id"]
        # Preserve CRLF from origin HTML; read_text's universal-newline conversion
        # would change the byte-faithful body hash even though the file is intact.
        body = source_file(m["body_file"]).read_bytes().decode("utf-8")
        assert hashlib.sha256(body.encode("utf-8")).hexdigest() == m["body_sha256"], m["id"]
        assert m["text_body_complete"] and m["article_text_validated"], m["id"]
        if "api_code" in m:
            data = json.loads(raw)
            assert data["code"] == 0
            assert data["value"]["title"] == m["expected_title"]
            assert data["value"]["content"]["content"] == body and body.strip()
        text = source_file(m["text_file"]).read_text(encoding="utf-8")
        assert text.strip()
        checks.append({"id": m["id"], "raw_hash_matches": True, "raw_length_matches": True, "body_hash_matches": True, "validated_api_or_article": True, "complete_html_response": True, "embedded_images_reviewed": False, "response_bytes": len(raw), "text_utf8_bytes": len(text.encode("utf-8"))})
    texts = {m["id"]: source_file(m["text_file"]).read_text(encoding="utf-8") for m in success}
    key_phrases = {
        "S01-wear-getting-started-en": ["For non-Huawei phones, HMS Core (APK) is also required", "Phone runs Android 6.0 or later"],
        "S02-wear-getting-started-cn": ["若为非华为手机，则需同时装有HMS Core（APK）", "允许华为运动健康App在后台弹出界面"],
        "S03-wear-service-introduction-en": ["Android 6.0–14.0", "uses Android interface definition language (AIDL)"],
        "S05-non-huawei-install-cn": ["华为应用市场网页版", "HMS Core"],
        "S06-hms-install-needed-en": ["official HUAWEI AppGallery website", "malware detection"],
        "S08-health-system-requirements-en": ["Android 8.0"],
        "S16-wear-phone-version-history-en": ["13.1.3.300", "14.0.12.310"],
    }
    for sid, phrases in key_phrases.items():
        assert all(p in texts[sid] for p in phrases), sid
    links = json.loads((BASE / "S05-non-huawei-install-cn.links.json").read_text(encoding="utf-8"))
    assert "https://appgallery.huawei.com/#/Featured" in links
    parser = RowParser()
    parser.feed((BASE / "S25-wear-result-codes-cn.body.html").read_text(encoding="utf-8"))
    expected_codes = {3: "ERROR_CODE_HEALTH_LOGOUT", 6: "ERROR_CODE_SERVER_REMOTE_BINDER", 7: "ERROR_CODE_USER_UNAUTHORIZED_IN_HEALTH", 8: "ERROR_CODE_SCOPE_UNAUTHORIZED", 9: "ERROR_CODE_USER_UNAUTHORIZED_IN_WEAR_ENGINE", 13: "ERROR_CODE_DEVICE_VERSION_NOT_SUPPORT", 14: "ERROR_CODE_HEALTH_VERSION_IS_LOW", 15: "ERROR_CODE_HEALTH_NOT_AUTO_START", 18: "ERROR_CODE_INTERFACE_IS_NOT_SUPPORTED", 19: "ERROR_CODE_SERVICE_TIMEOUT"}
    code_rows = []
    for value, name in expected_codes.items():
        matching = [row for row in parser.rows if name in row and str(value) == row[-1]]
        assert matching, (value, name)
        code_rows.append({"value": value, "constant": name, "official_row": matching[0]})
    version = lambda v: tuple(map(int, v.split(".")))
    version_check = {"parent_supplied_huawei_health": "16.1.2.310", "minimum_health_for_wear_sdk_5.0.3.301": "13.1.3.300", "minimum_health_for_wear_sdk_5.0.3.304": "14.0.12.310", "health_301_numeric_threshold_met": version("16.1.2.310") >= version("13.1.3.300"), "health_304_numeric_threshold_met": version("16.1.2.310") >= version("14.0.12.310"), "modified_package_functionality_proven": False}
    verification = {"verified_at": datetime.datetime.now().astimezone().isoformat(timespec="seconds"), "source_count": len(metas), "successful_sources": len(success), "failed_sources": len(failed), "successful_source_checks": checks, "critical_phrases_checked": key_phrases, "official_appgallery_href_checked": "https://appgallery.huawei.com/#/Featured", "android_phone_official_error_rows": code_rows, "health_version_numeric_comparison": version_check, "wearengine_hms_core_minimum_version": "Not explicitly published in the inspected Wear Engine-specific documents; no numeric minimum claimed", "on_device_actions_performed": False, "apk_downloaded": False}
    (BASE / "capture-manifest.json").write_text(json.dumps(metas, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (BASE / "verification.json").write_text(json.dumps(verification, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    index = ["# 来源索引与抓取完整性", "", "所有下列正文为 2026-11-14 直接访问华为官方 HTTPS／公开正文 API 得到的新响应。未使用旧缓存作为新抓证据。", "", f"最新状态：{len(success)} 个成功来源；{len(failed)} 个未验证为正文的来源。首次标题不匹配及失败响应保留在各阶段 manifest 中。", "", "成功来源的完整性：完整 HTTP／API 返回文本，无本地截断；嵌入图片仅保留链接，没有下载、OCR 或视觉检查。API 页逐一验证 code=0、预期标题和非空 value.content.content；消费者页验证目标标题和关键正文。", "", "时间统一用本机实际 ISO 8601 时间（CST，UTC+08:00）。官网 updatedDate／displayUpdateTime 原样记录，无时区换算。", "", "## 各来源", ""]
    for m in metas:
        index.extend(["### " + m["id"], "", "- URL：<" + m["source_url"] + ">", "- 抓取开始：`" + m["retrieved_started"] + "`；完成：`" + m["retrieved_finished"] + "`。", "- 方法：`" + m["acquisition"] + "`；HTTP `" + str(m.get("http_status", "未获响应")) + "`；状态：**" + m["status"] + "**。"])
        if "api_code" in m:
            index.append("- API：`code=" + str(m["api_code"]) + "`；title=`" + str(m.get("actual_title")) + "`；catalog=`" + m["request_payload"]["catalogName"] + "`；language=`" + m["request_payload"]["language"] + "`。")
        if m["status"] == "success":
            index.append("- 完整性：正文完整、未截断；图像未审阅。")
            if "updatedDate" in m:
                index.append("- 官网原字段：updatedDate=`" + str(m.get("updatedDate")) + "`；displayUpdateTime=`" + str(m.get("displayUpdateTime")) + "`。")
        else:
            index.append("- **不能引用为已取得正文**：" + m.get("error", "unknown failure") + "。")
        for key, label in [("raw_file", "原始响应"), ("body_file", "正文 HTML"), ("text_file", "可读文本"), ("links_file", "原始链接")]:
            if key in m:
                name = Path(m[key]).name
                index.append("- " + label + "：[" + name + "](" + name + ")。")
        index.append("- 元数据：[" + m["id"] + ".meta.json](" + m["id"] + ".meta.json)。")
        if "raw_sha256" in m:
            index.append("- 原始响应 SHA-256：`" + m["raw_sha256"] + "`。")
        if "healthkit" in m["id"]:
            index.append("- 使用限制：此来源为 Health Service Kit，不是 Wear Engine；仅保留作不可移植其最低版本的反例。")
        index.append("")
    index.extend(["## 机械验收", "", "校验结果：[verification.json](verification.json)。主笔记：[官方口径核查.md](官方口径核查.md)。", "", "首次 S02 title 预期不符（真实为使用入门）及 S26 title 预期不符（真实为 Constant-values）均先判失败，随后以返回的真实标题重新请求并验证成功；完整源 slug 没有修补／改写。S15 AppGallery 首页直接 GET 只返壳，最终仍标失败。", ""])
    (BASE / "来源索引.md").write_text("\n".join(index), encoding="utf-8")
    print(json.dumps({"successful_sources": len(success), "failed_sources": len(failed), "source_hash_and_body_checks": "all passed", "official_numeric_error_code_checks": "all passed", "official_conditions_and_entry_phrases": "all passed", "created": [str(BASE / "来源索引.md"), str(BASE / "capture-manifest.json"), str(BASE / "verification.json")], "primary_note": str(BASE / "官方口径核查.md")}, ensure_ascii=False))

if __name__ == "__main__":
    main()
