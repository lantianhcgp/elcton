"""Prepare immutable, credential-free source evidence; no AGC writes or device actions."""
import hashlib
import json
import re
import shutil
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DELIVERY = Path('/storage/emulated/0/Documents/elcton-WearEngine-真机联调-20261113-123000')
BASE = 'https://h5hosting-drcn.dbankcdn.cn/sandbox/cc/healthkit/cardPortal/js8I4UZXT1enTrlCW5QNEw/assets/'
SOURCES = ['01-官方接入证据.md', '04-控制台配置核对.md',
           'console/agc-readonly-20261113-wear-grants.json',
           'console/agc-readonly-20261113-wear-service-page.json']


def record(path, **extra):
    data = path.read_bytes()
    return {'path': str(path.relative_to(ROOT)), 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest(), **extra}


historical = []
for rel in SOURCES:
    source = DELIVERY / rel
    destination = ROOT / 'historical' / Path(rel).name
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    historical.append(record(destination, source=str(source), historical_only=True))

log = DELIVERY / 'probe-logcat-scope unauthorized-20261114.txt'
raw = log.read_bytes()
lines = raw.decode('utf-8', errors='strict').splitlines()
patterns = [re.compile(re.escape(t)) for t in (
    'isServiceSupport apiName:device_get_common_device',
    'isServiceSupport serviceApiLevel: 14, minSupportApiLevel:8',
    ' · getCommonDevice',
    'com.huawei.wearengine.WearEngineException [errorCode=8]: Scope unauthorized')]
selected = [(index, line) for index, line in enumerate(lines, 1)
            if any(pattern.search(line) for pattern in patterns)]
assert len(selected) == 4, f'Unexpected log excerpt count: {len(selected)}'
logdir = ROOT / 'realdevice'
logdir.mkdir(parents=True, exist_ok=True)
(logdir / 'scope-error-excerpt.txt').write_text(
    '\n'.join(f'{index}|{line}' for index, line in selected) + '\n')
metadata = {'source': str(log), 'bytes': len(raw),
            'sha256': hashlib.sha256(raw).hexdigest(), 'selected_lines': [x[0] for x in selected],
            'excerpt_sha256': hashlib.sha256((logdir / 'scope-error-excerpt.txt').read_bytes()).hexdigest(),
            'capture_date': '2026-11-14', 'excerpt_prepared_at': datetime.now().astimezone().isoformat(),
            'capture_by_this_task': False,
            'note': 'Original capture supplied by initiator; only verbatim relevant lines are published. No new device operation.'}
(logdir / 'provenance.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n')

frontend = []
for path in sorted((ROOT / 'frontend').glob('*.js')):
    url = BASE + path.name
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=20) as response:
        remote = response.read()
        status = response.status
    local = path.read_bytes()
    assert status == 200 and local == remote, path.name
    frontend.append(record(path, url=url, http_status=status, remote_equals_local=True,
                           checked_at=datetime.now().astimezone().isoformat()))

component = (ROOT / 'frontend/wearEngineCheckBox-50a2e529.js').read_text()
start = component.index('Ce=[')
end = component.index('],Ee=', start)
permission_literal = component[start:end + 1]
scopes = re.findall(r'id:"(com\.huawei\.hiwear\.[^"]+)"', permission_literal)
assert scopes == ['com.huawei.hiwear.devicemanager', 'com.huawei.hiwear.notification',
                  'com.huawei.hiwear.wearuserstatus', 'com.huawei.hiwear.motionsensor',
                  'com.huawei.hiwear.sensors', 'com.huawei.hiwear.startremoteapp']
(ROOT / 'frontend/scope-list-excerpt.txt').write_text(permission_literal + '\n')
(ROOT / 'frontend/source-verification.json').write_text(json.dumps(
    {'checked_at': datetime.now().astimezone().isoformat(), 'files': frontend,
     'scope_ids': scopes, 'scope_count': len(scopes), 'per_api_get_common_device_checkbox_found': False,
     'claim_scope': 'This permission component and its apply/detail callers; not every Huawei backend'},
    ensure_ascii=False, indent=2) + '\n')
(ROOT / 'historical/provenance.json').write_text(json.dumps(
    {'files': historical, 'note': 'Historical readback is not a current server read. Missing values must remain unknown.'},
    ensure_ascii=False, indent=2) + '\n')

log_result = {key: metadata[key] for key in ['bytes', 'sha256', 'selected_lines']}
print(json.dumps({'historical_files': len(historical), 'verified_frontend_files': len(frontend),
                  'scope_count': len(scopes), 'real_device_source': log_result}, ensure_ascii=False, indent=2))
