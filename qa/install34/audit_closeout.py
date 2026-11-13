#!/usr/bin/env python3
"""Read-only final runtime/package evidence; writes a unique audit receipt only.
Never kills, launches, installs, or touches an unrelated project.
"""
from datetime import datetime
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
E = ROOT / 'qa/install34/evidence'
H = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def audit(source):
    ci = json.loads((E / ('ci-exact-' + source[:8] + '.json')).read_text())
    delivery = json.loads((E / ('delivery-' + source[:8] + '.json')).read_text())
    gate = json.loads((E / 'gate-rereview.json').read_text())
    assert ci['source_sha'] == delivery['source_sha'] == gate['source_sha'] == source
    dst = Path(delivery['hap'])
    assert H(dst) == ci['hap_sha256'] == gate['hap_sha256'] == delivery['hap_sha256']
    assert dst.stat().st_size == delivery['hap_bytes']
    for row in delivery['archived']:
        assert not Path(row['from']).exists() and H(Path(row['to'])) == row['sha256']
    raw = subprocess.check_output(['ps', '-A', '-o', 'pid,ppid,args'], text=True)
    suspicious = []
    for line in raw.splitlines()[1:]:
        parts = line.strip().split(None, 2)
        if len(parts) != 3:
            continue
        cmd = parts[2]
        # Ours is the single read-only auditor, not a residual background process.
        if 'audit_closeout.py' in cmd or 'python3 -c' in cmd:
            continue
        if any(t in cmd for t in ('/usr/lib/chromium', 'chromium-browser',
                                  'qa/install34/', 'elcton-wear-install34', '/bin/jerry')):
            suspicious.append({'pid': int(parts[0]), 'ppid': int(parts[1]), 'args': cmd[:400]})
    assert not suspicious, 'Residual task/browser process: ' + json.dumps(suspicious)
    bound = json.loads((E / ('final-review-input-' + source[:8] + '.json')).read_text())
    assert all(H(ROOT / r['path']) == r['sha256'] for r in bound['files'])
    historical = subprocess.check_output(['git', 'ls-files', 'qa/install34/evidence'], cwd=ROOT).decode().splitlines()
    historical = [n for n in historical if subprocess.run(['git', 'cat-file', '-e', 'e62fe509:' + n], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0]
    assert all((ROOT / n).read_bytes() == subprocess.check_output(['git', 'show', 'e62fe509:' + n], cwd=ROOT) for n in historical)
    result = {'source_sha': source, 'run_id': ci['run_id'], 'checked_at': datetime.now().astimezone().isoformat(),
              'hap': str(dst), 'hap_sha256': H(dst), 'hap_bytes': dst.stat().st_size,
              'archive_count': len(delivery['archived']), 'all_old_bytes_retained': True,
              'historical_evidence_count': len(historical), 'all_original_evidence_bytes_retained': True,
              'process_matches': suspicious, 'no_remaining_task_or_chromium_process': True,
              'no_device_action': True, 'user_installation_pending': True,
              'scope': 'Process absence and exact delivered bytes only; no real-device result'}
    target = E / ('closeout-audit-' + source[:8] + '.json')
    with target.open('x') as f:
        f.write(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    audit(sys.argv[1])
