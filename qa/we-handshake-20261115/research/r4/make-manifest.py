#!/usr/bin/env python3
"""Fail-closed R4-only publication manifest; no product or private artifacts."""
from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[4]
Q = ROOT / 'qa/we-handshake-20261115'
paths = []
for folder in (Q / 'research/r4', Q / 'evidence/r4'):
    paths.extend(str(p.relative_to(ROOT)) for p in folder.rglob('*') if p.is_file() and '__pycache__' not in p.parts)
paths.append(str((Q / 'DELIVERY-R4-20261115.md').relative_to(ROOT)))
paths.extend(str(p.relative_to(ROOT)) for p in (Q / 'reviews').glob('r4-*.json'))
paths = sorted(set(paths))
assert paths and all(p.startswith('qa/we-handshake-20261115/') for p in paths)
assert not any(p.endswith(('.hap', '.app', '.apk', '.pem', '.p12')) for p in paths)
report = Q / 'evidence/r4/publish-file-list.json'
if str(report.relative_to(ROOT)) not in paths:
    paths.append(str(report.relative_to(ROOT)))
paths = sorted(paths)
report.write_text(json.dumps(paths, indent=2) + '\n')
check = subprocess.run(['git', 'diff', '--check'], cwd=ROOT, capture_output=True)
assert check.returncode == 0, 'tracked_whitespace_error'
summary = {'files': len(paths), 'bytes': sum((ROOT / p).stat().st_size for p in paths),
           'prefix_only': 'qa/we-handshake-20261115', 'product_changed': False}
print(json.dumps(summary))
