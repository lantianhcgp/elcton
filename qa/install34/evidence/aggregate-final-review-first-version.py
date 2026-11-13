#!/usr/bin/env python3
"""Bind both independent final verdicts to immutable signed bytes; fail closed."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
H = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()


def aggregate(source):
    e = ROOT / 'qa/install34/evidence'
    inp = e / ('final-review-input-' + source[:8] + '.json')
    context = json.loads(inp.read_text())
    assert source == context['source_sha']
    assert all(H(ROOT / r['path']) == r['sha256'] for r in context['files'])
    ci = json.loads((e / ('ci-exact-' + source[:8] + '.json')).read_text())
    assert context['hap_sha256'] == ci['hap_sha256'] == H(Path(ci['hap']))
    current = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT).decode().strip()
    assert current == source, 'Source moved before final approval'
    assert not subprocess.check_output(['git', 'diff', '--binary', '--', 'entry', 'scripts', 'tests', '.github', 'tools/sign'], cwd=ROOT)
    rows = []
    for axis in ('standards', 'spec'):
        p = e / ('final-artifact-review-' + axis + '-' + source[:8] + '.json')
        a = json.loads(p.read_text())
        assert a['axis'] == axis
        no_findings = not a['security_concerns'] and not a['logic_errors'] and not a['missing_requirements']
        assert a['passed'] is True and a['passed'] == no_findings, 'Reviewer does not approve: ' + axis
        assert a['source_sha'] == source and a['hap_sha256'] == ci['hap_sha256']
        assert a['review_input_sha256'] == H(inp), 'Stale review input: ' + axis
        for r in a['reviewed_files']:
            path = Path(r['path'])
            assert H(path if path.is_absolute() else ROOT / path) == r['sha256'], 'Reviewed file drift: ' + str(path)
        rows.append({'axis': axis, 'path': str(p.relative_to(ROOT)), 'sha256': H(p),
                     'passed': a['passed'], 'summary': a['summary']})
    original = e / 'checker-fix-result.json'
    old_spec = e / 'gate-rereview-spec.json'
    assert H(original) == '3a5a380e521cb2dcd93835430820f6c0259592b4f2292b1704c4f126a29c218d'
    assert json.loads(original.read_text())['passed'] is False
    assert H(old_spec) == 'cf17d9207622f1275ca37dda59ead6b4f3d51d3c4b474f8927a60202ddfd14c1'
    assert json.loads(old_spec.read_text())['passed'] is False
    out = {'source_sha': source, 'run_id': ci['run_id'], 'hap_sha256': ci['hap_sha256'],
           'app_sha256': ci['app_sha256'], 'review_input_sha256': H(inp),
           'passed': True, 'candidate_artifact_approved': True, 'independent_axes': rows,
           'old_red_receipts_preserved': True, 'installation_tested': False,
           'scope': 'Exact candidate signed bytes and same-SDK parse approved for user installation test; no FIT3 install34/UI/heap/Wear Engine E2E claim'}
    target = e / 'gate-rereview.json'
    with target.open('x') as f:
        f.write(json.dumps(out, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'passed': True, 'source_sha': source, 'hap_sha256': ci['hap_sha256'], 'gate_path': str(target)}))


if __name__ == '__main__':
    aggregate(sys.argv[1])
