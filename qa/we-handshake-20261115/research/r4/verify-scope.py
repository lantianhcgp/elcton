#!/usr/bin/env python3
"""Recompute R4 protected source hashes and original phone checkout status."""
from pathlib import Path
import hashlib
import json
import subprocess
import time

ROOT = Path(__file__).resolve().parents[4]
Q = ROOT / 'qa/we-handshake-20261115'
BASELINE = json.loads((Q / 'research/r4/r4-baseline.json').read_text())
PHONE = Path.home() / 'elcton-phone-release-029-20261114'


def fingerprint_drift(root, values):
    differences = []
    for name, expected in values.items():
        path = root / name
        actual = hashlib.sha256(path.read_bytes()).hexdigest() if path.is_file() else None
        if actual != expected:
            differences.append(name)
    return differences


phone_drift = fingerprint_drift(PHONE, BASELINE['phone_hashes'])
watch_drift = fingerprint_drift(ROOT, BASELINE['watch_hashes'])
phone_head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=PHONE).decode().strip()
phone_status = subprocess.check_output(['git', 'status', '--short'], cwd=PHONE).decode()
protected_diff = subprocess.check_output(
    ['git', 'diff', BASELINE['watch_head'], '--', 'entry', 'scripts', 'tools/sign', '.github', 'tests'], cwd=ROOT)
report = {
    'passed': not phone_drift and not watch_drift and phone_head == BASELINE['phone_head']
              and phone_status == BASELINE['phone_status'] and not protected_diff,
    'at': time.strftime('%Y-%m-%d %H:%M:%S %z'),
    'phone_files_checked': len(BASELINE['phone_hashes']), 'phone_drift': phone_drift,
    'phone_head_equal': phone_head == BASELINE['phone_head'],
    'phone_status_equal': phone_status == BASELINE['phone_status'],
    'watch_protected_files_checked': len(BASELINE['watch_hashes']), 'watch_drift': watch_drift,
    'protected_git_diff_bytes': len(protected_diff), 'device_operations_used': False,
}
(Q / 'evidence/r4/scope-protection-parent-recheck.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
raise SystemExit(0 if report['passed'] else 1)
