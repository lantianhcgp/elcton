#!/usr/bin/env python3
"""Read-only R4 publication and HAP audit; never prints credentials."""
from pathlib import Path
import hashlib
import json
import re
import time

ROOT = Path(__file__).resolve().parents[4]
Q = ROOT / 'qa/we-handshake-20261115'
items = sorted(p for folder in (Q / 'research/r4', Q / 'evidence/r4') for p in folder.rglob('*')
               if p.is_file() and '__pycache__' not in p.parts)
items.extend(sorted((Q / 'reviews').glob('r4-*.json')))
items.append(Q / 'DELIVERY-R4-20261115.md')
patterns = {
    'github_token': rb'(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}',
    'api_key': rb'sk-[A-Za-z0-9_-]{24,}',
    'private_key': rb'-----BEGIN (?:EC |RSA )?PRIVATE KEY-----',
    'bearer_value': rb'Bearer [A-Za-z0-9._-]{20,}',
}
known = []
runtime = Path.home() / '.hermes/secrets/watch_logger.json'
if runtime.is_file():
    data = json.loads(runtime.read_text())
    known = [str(data[k]).encode() for k in ('write_key', 'read_key') if data.get(k)]
hits = []
for p in items:
    blob = p.read_bytes()
    names = [name for name, pattern in patterns.items() if re.search(pattern, blob)]
    if any(value in blob for value in known):
        names.append('known_logger_secret')
    if names:
        hits.append({'path': str(p.relative_to(ROOT)), 'classes': names})
report = {
    'passed': not hits,
    'at': time.strftime('%Y-%m-%d %H:%M:%S %z'),
    'files_checked': len(items),
    'total_bytes': sum(p.stat().st_size for p in items),
    'hits': hits,
    'known_secrets_checked': len(known),
    'values_printed': False,
}
(Q / 'evidence/r4/publish-secret-audit.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
haproot = Path('/storage/emulated/0/haps')
rows = [{'path': str(p.relative_to(haproot)), 'bytes': p.stat().st_size,
         'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
        for p in sorted(haproot.rglob('*')) if p.is_file()]
hapreport = {'at': time.strftime('%Y-%m-%d %H:%M:%S %z'), 'file_count': len(rows),
             'files': rows, 'operation': 'read_only', 'moved': [], 'deleted': [], 'new_hap': False}
(Q / 'evidence/r4/haps-readonly-inventory.json').write_text(json.dumps(hapreport, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'haps_files': len(rows), 'new_hap': False, 'all_paths_read_only': True}))
raise SystemExit(0 if report['passed'] else 1)
