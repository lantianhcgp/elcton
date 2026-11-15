#!/usr/bin/env python3
"""Fail-closed local R4 closure before publication; does not push or alter products."""
from pathlib import Path
import hashlib
import json
import subprocess
import time

ROOT = Path(__file__).resolve().parents[4]
Q = ROOT / 'qa/we-handshake-20261115'
E = Q / 'evidence/r4'
checks = {}


def check(name, condition):
    checks[name] = bool(condition)
    if not condition:
        raise AssertionError(name)


for axis, name in [('spec', 'r4-spec-retry2.json'), ('quality', 'r4-quality.json')]:
    path = Q / 'reviews' / name
    check(axis + '_receipt_present', path.is_file())
    review = json.loads(path.read_text())
    fingerprints = review.get('binding', {}).get('documents_sha256', {})
    required_docs = {'qa/we-handshake-20261115/DELIVERY-R4-20261115.md',
                     'qa/we-handshake-20261115/research/r4/PHONE-DIAGNOSTIC-PATCH-PLAN.md'}
    check(axis + '_document_binding_complete', set(fingerprints) == required_docs)
    for document, fingerprint in fingerprints.items():
        check(axis + '_exact_document_' + document,
              hashlib.sha256((ROOT / document).read_bytes()).hexdigest() == fingerprint)
    for evidence, fingerprint in review.get('binding', {}).get('sha256', {}).items():
        check(axis + '_exact_evidence_' + evidence,
              hashlib.sha256((ROOT / evidence).read_bytes()).hexdigest() == fingerprint)
    check(axis + '_passed_fail_closed', review.get('passed') is True
          and not review.get('security_concerns') and not review.get('logic_errors')
          and not review.get('missing_requirements'))
check('old_spec_refusal_preserved', hashlib.sha256((Q / 'reviews/r4-spec.json').read_bytes()).hexdigest()
      == '66e1c1353fc2d6b27203d22e2994fd8dc7022c00a7a3557a499446bfe696d9cd')
for path in ['evidence/r4/evidence-verification.json', 'evidence/r4/publish-secret-audit.json',
             'evidence/r4/scope-protection-parent-recheck.json', 'evidence/r4/remote-reader-selftest.json']:
    report = json.loads((Q / path).read_text())
    check(path + '_pass', report.get('passed') is True)
regression = json.loads((E / 'unchanged-full-regression.json').read_text())
check('unchanged_regression445', regression['exit_code'] == 0
      and regression['totals']['tests'] == regression['totals']['pass'] == 445
      and regression['totals']['fail'] == regression['totals']['skipped'] == 0)
manifest = json.loads((E / 'publish-file-list.json').read_text())
check('manifest_unique_scope_only', manifest and len(manifest) == len(set(manifest))
      and all(name.startswith('qa/we-handshake-20261115/') for name in manifest)
      and all((ROOT / name).is_file() for name in manifest)
      and not any(name.endswith(('.hap', '.apk', '.app', '.pem', '.p12')) for name in manifest))
product_diff = subprocess.check_output(['git', 'diff', 'ff2a1b2858af88887b2132b77bcfce162a60fa48', '--',
                                        'entry', 'scripts', 'tools/sign', 'tests', '.github'], cwd=ROOT)
check('no_product_change', not product_diff)
check('no_whitespace_errors', subprocess.run(['git', 'diff', '--check'], cwd=ROOT,
                                            capture_output=True).returncode == 0)
result = {'passed': all(checks.values()), 'checks': checks,
          'at': time.strftime('%Y-%m-%d %H:%M:%S %z'), 'product_changed': False,
          'root_cause_proven': False, 'handshake_repaired': False, 'new_hap': False,
          'publications_status': 'NOT_CLAIMED_THIS_IS_PREPUBLICATION',
          'manifest_files': len(manifest)}
(E / 'local-closure.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({key: value for key, value in result.items() if key != 'checks'}))
