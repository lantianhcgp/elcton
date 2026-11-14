"""Fail-closed publication gate; secret values are never printed or written."""
import hashlib
import json
import re
import subprocess
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / 'Scope修复报告.md'
MANIFEST = ROOT / 'MANIFEST.sha256.json'
EXCLUDED = {MANIFEST, ROOT / 'validation.json'}

secret_values = set()
credentials_path = Path.home() / '.hermes/secrets/huawei_cred.json'
credentials = json.loads(credentials_path.read_text())
for key in ['phone', 'pw', 'password']:
    value = credentials.get(key)
    if isinstance(value, str) and len(value) >= 8:
        secret_values.add(value.encode())
credentials.clear()

git_credentials = (Path.home() / '.git-credentials').read_text()
for token in re.findall(r'(?:ghp_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+)', git_credentials):
    secret_values.add(token.encode())
git_credentials = ''

patterns = [
    ('personal-api-token', re.compile(rb'(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{24,})')),
    ('private-key-material', re.compile(rb'-----BEGIN (?:EC |RSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----')),
    ('credential-http-header', re.compile(rb'(?:' + b'Author' + b'ization:[ ]*(?:Bear' + b'er|token)[ ]+[A-Za-z0-9+/_=-]{24,})')),
    ('cookie-header-value', re.compile(rb'(?im)^Cookie:[ ]*[A-Za-z0-9_]+=[^\r\n]{16,}')),
]
violations = []
files = sorted(path for path in ROOT.rglob('*') if path.is_file() and path not in EXCLUDED)
for path in files:
    if path.is_symlink() or path.suffix in {'.p12','.pfx','.key','.pem','.so','.session'} or 'browser-profile' in path.parts:
        violations.append({'path': str(path.relative_to(ROOT)), 'kind': 'forbidden-artifact'})
    data = path.read_bytes()
    for secret in secret_values:
        if secret in data:
            violations.append({'path': str(path.relative_to(ROOT)), 'kind': 'known-private-value'})
            break
    for name, pattern in patterns:
        if pattern.search(data):
            violations.append({'path': str(path.relative_to(ROOT)), 'kind': name})
secret_values.clear()
if violations:
    print(json.dumps({'passed': False, 'violations': violations}, ensure_ascii=False))
    raise SystemExit(1)

report = REPORT.read_text()
assert len(REPORT.read_bytes()) >= 14000
assert '[truncated]' not in report
for required in ['状态：未修复', '118599721', '101653523864732872', 'com.hcbiu.elcton',
                 'passedPowerList', 'betaPowerList', 'approveStatus', 'stateRange',
                 'DEVICE_MANAGER', '24小时', '回滚', '认证阻塞', '复测仍由发起方']:
    assert required in report, required

for path in ROOT.glob('session-*.json'):
    data = json.loads(path.read_text())
    assert data.get('http_status') == 401, path.name
    assert data.get('scope_mutation_attempted', data.get('mutation_attempted')) is False
    assert data.get('verified', False) is False

for path in (ROOT / 'official').glob('*.json'):
    data = json.loads(path.read_text())
    assert data['code'] == 0 and data['value']['content']['content'], path.name

frontend = json.loads((ROOT / 'frontend/source-verification.json').read_text())
assert frontend['scope_count'] == len(frontend['scope_ids']) == 6
assert len(frontend['files']) == 6
for info in frontend['files']:
    path = ROOT / info['path']
    assert info['remote_equals_local'] and info['http_status'] == 200
    assert info['bytes'] == len(path.read_bytes())
    assert info['sha256'] == hashlib.sha256(path.read_bytes()).hexdigest()

syntax_files = []
for path in (ROOT / 'tools').iterdir():
    if path.suffix in {'.js','.mjs'}:
        result = subprocess.run(['node','--check',str(path)], capture_output=True)
        assert result.returncode == 0, f'Syntax gate failed: {path.name}'
        syntax_files.append(path.name)
    elif path.suffix == '.py':
        compile(path.read_bytes(), str(path), 'exec')
        syntax_files.append(path.name)

manifest = []
for path in files:
    data = path.read_bytes()
    manifest.append({'path': str(path.relative_to(ROOT)), 'bytes': len(data),
                     'sha256': hashlib.sha256(data).hexdigest()})
MANIFEST.write_text(json.dumps({'excludes': ['MANIFEST.sha256.json','validation.json'],
                               'file_count': len(manifest), 'files': manifest}, ensure_ascii=False, indent=2) + '\n')
result = {'checked_at': datetime.now().astimezone().isoformat(), 'passed': True,
          'secret_scan': 'PASS known-value+pattern+forbidden-artifact gates; values not disclosed',
          'files_scanned': len(files), 'syntax_files': syntax_files,
          'report_bytes': len(REPORT.read_bytes()), 'report_sha256': hashlib.sha256(REPORT.read_bytes()).hexdigest(),
          'artifact_only_verification': True, 'live_scope_verified': False,
          'live_scope_mutations': 0, 'device_actions': 0}
(ROOT / 'validation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(result, ensure_ascii=False, indent=2))
