#!/usr/bin/env python3
"""Deliver only a fully verified candidate; archive old WE files without deletion.
Exact same-volume move preserves the previous package. Never installs anything.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
SHA = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def deliver(source_sha):
    assert len(source_sha) == 40 and set(source_sha) <= set('0123456789abcdef')
    e = ROOT / 'qa/install34/evidence'
    receipt = json.loads((e / ('ci-exact-' + source_sha[:8] + '.json')).read_text())
    proof = json.loads((e / ('local-artifact-proof-' + source_sha[:8] + '.json')).read_text())
    gate = json.loads((e / 'gate-rereview.json').read_text())
    assert receipt['source_sha'] == proof['source_sha'] == gate['source_sha'] == source_sha
    assert proof['passed'] and gate['passed'] and gate['candidate_artifact_approved']
    assert proof['native_all_files_bound'] and proof['one_byte_negative_rejected']
    assert proof['device_installation_tested'] is False
    src = Path(receipt['hap'])
    digest = receipt['hap_sha256']
    assert SHA(src) == digest == proof['hap_sha256'] == gate['hap_sha256']
    root = Path('/storage/emulated/0/haps')
    dst = root / ('elcton-20261113-34fix-' + digest[:8] + '.hap')
    archive = root / '旧包归档'
    assert root.is_dir() and not dst.exists(), 'Delivery must not overwrite an existing name'
    old = [p for p in root.iterdir() if p.is_file() and p.suffix == '.hap'
           and ('wearengine' in p.name.lower() or p.name.startswith('elcton-20261113-34fix-'))]
    assert all(not (archive / p.name).exists() for p in old), 'Archive collision; no moves allowed'
    expected = {str(p): SHA(p) for p in old}
    # Exclusive copy is verified before moving any old package.
    with src.open('rb') as inp, dst.open('xb') as out:
        while data := inp.read(1024*1024):
            out.write(data)
        out.flush()
        os.fsync(out.fileno())
    assert SHA(dst) == digest, 'Copied candidate bytes differ'
    moved = []
    archive.mkdir(parents=True, exist_ok=True)
    for p in old:
        target = archive / p.name
        assert not target.exists() and SHA(p) == expected[str(p)]
        subprocess.run(['mv', '--no-clobber', '--', str(p), str(target)], check=True)
        assert not p.exists() and target.is_file() and SHA(target) == expected[str(p)]
        moved.append({'from': str(p), 'to': str(target), 'sha256': SHA(target)})
    result = {'source_sha': source_sha, 'run_id': receipt['run_id'], 'hap': str(dst),
              'hap_sha256': SHA(dst), 'hap_bytes': dst.stat().st_size,
              'archived': moved, 'old_files_retained': True, 'no_overwrites': True,
              'no_device_action': True, 'installation_pending_user': True}
    with (e / ('delivery-' + source_sha[:8] + '.json')).open('x') as f:
        f.write(json.dumps(result, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    deliver(sys.argv[1])
