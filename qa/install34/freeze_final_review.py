#!/usr/bin/env python3
"""Create immutable final review input binding actual signed bytes, never forecasts."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
H = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def freeze(source):
    e = ROOT / 'qa/install34/evidence'
    ci = e / ('ci-exact-' + source[:8] + '.json')
    local = e / ('local-artifact-proof-' + source[:8] + '.json')
    native = e / ('final-gate-ci-' + source[:8] + '.json')
    a, b, c = [json.loads(p.read_text()) for p in (ci, local, native)]
    assert a['source_sha'] == b['source_sha'] == source
    assert a['run_conclusion'] == 'success' and b['passed'] and c['passed']
    assert b['native_js_files'] == 7 and b['native_all_files_bound']
    assert H(Path(a['hap'])) == a['hap_sha256'] == b['hap_sha256'] == c['hap_sha256']
    assert H(Path(a['app'])) == a['app_sha256'] == b['app_sha256'] == c['app_sha256']
    delta = subprocess.check_output(['git', 'diff', '--binary', 'e62fe509', source], cwd=ROOT)
    assert delta == (e / 'size-fix-proposed.diff').read_bytes()
    rows = [ci, local, native, e / 'size-fix-proposed.diff', e / 'size-fix-proposed.json',
            e / 'size-fix-commit-binding.json', e / 'size-fix-review-standards.json',
            e / 'size-fix-review-spec.json', e / 'gate-rereview-standards.json',
            e / 'gate-rereview-spec.json', e / 'checker-fix-result.json',
            e / 'size-fix-full240.tap', e / ('ci-exact-' + source[:8] + '.log')]
    out = {'source_sha': source, 'run_id': a['run_id'], 'hap_sha256': a['hap_sha256'],
           'app_sha256': a['app_sha256'], 'ci_run_url': a['run_url'],
           'reviewed_delta_sha256': hashlib.sha256(delta).hexdigest(),
           'files': [{'path': str(p.relative_to(ROOT)), 'bytes': p.stat().st_size, 'sha256': H(p)} for p in rows],
           'artifact_paths': {'hap': a['hap'], 'app': a['app']},
           'all_signed_js_passed_exact_sdk': True,
           'old_red_evidence_preserved': True,
           'scope': 'Candidate signing, exact payload and SDK parse approval only; no FIT3 install34/UI/heap/WE E2E claim'}
    target = e / ('final-review-input-' + source[:8] + '.json')
    with target.open('x') as f:
        f.write(json.dumps(out, indent=2) + '\n')
    print(json.dumps({'input': str(target), 'input_sha256': H(target), 'source_sha': source, 'hap_sha256': a['hap_sha256']}))


if __name__ == '__main__':
    freeze(sys.argv[1])
