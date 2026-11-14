import json
import sys
import urllib.request
from pathlib import Path
from datetime import datetime
from html.parser import HTMLParser

class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []
    def handle_data(self, data):
        self.parts.append(data)
    def handle_starttag(self, tag, attrs):
        if tag in ('p', 'h1', 'h2', 'h3', 'h4', 'h5', 'li', 'tr', 'td', 'pre'):
            self.parts.append('\n')

root = Path(__file__).resolve().parents[1] / 'official'
root.mkdir(parents=True, exist_ok=True)
for catalog, slug in [
    ('connectivity-Guides', 'faq-0000001050818031'),
    ('connectivity-Guides', 'applying-wearengine-0000001050777982'),
    ('connectivity-Guides', 'requesting-user-authorization-0000001050819181'),
    ('connectivity-References', 'permission-0000001059433005'),
    ('connectivity-Guides', 'device-connection-management-0000001050779152'),
]:
    payload = {'objectId': slug, 'language': 'cn', 'catalogName': catalog}
    url = 'https://svc-drcn.developer.huawei.com/community/servlet/consumer/cn/documentPortal/getDocumentById'
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={'Content-Type': 'application/json'}, method='POST')
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read(); status = response.status
        data = json.loads(raw)
        html = data.get('value', {}).get('content', {}).get('content', '')
        if status != 200 or data.get('code') != 0 or not html:
            print(json.dumps({'slug': slug, 'status': status, 'code': data.get('code'), 'verified': False})); continue
        path = root / (slug + '.json'); path.write_bytes(raw)
        parser = Text(); parser.feed(html); text = ''.join(parser.parts)
        (root / (slug + '.txt')).write_text(text)
        print(json.dumps({'slug': slug, 'status': status, 'code': data['code'], 'title': data['value'].get('title'), 'bytes': len(raw), 'fetched_at': datetime.now().astimezone().isoformat(), 'source': f'https://developer.huawei.com/consumer/cn/doc/{catalog}/{slug}'}, ensure_ascii=False))
        for term in ['Scope unauthorized', '每24小时', '重新提交', '审批通过', 'getCommonDevice', 'DEVICE_MANAGER']:
            start = text.find(term)
            if start >= 0:
                print(text[max(0, start-120):start+1100])
    except Exception as exc:
        print(json.dumps({'slug': slug, 'error_type': type(exc).__name__}))
