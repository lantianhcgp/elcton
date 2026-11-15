#!/usr/bin/env python3
"""Stage only audited R4 evidence after independent two-axis review."""
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[4]
Q = ROOT / 'qa/we-handshake-20261115'
E = Q / 'evidence/r4'


def run(argv):
    result = subprocess.run(argv, cwd=ROOT, capture_output=True)
    if result.returncode:
        raise RuntimeError('command_failed_' + str(result.returncode))
    return result.stdout


closure = json.loads((E / 'local-closure.json').read_text())
assert closure['passed'] is True and not closure['product_changed'], 'closure_not_passed'
assert run(['git', 'diff', '--cached', '--name-only']).strip() == b'', 'preexisting_index_changes'
paths = json.loads((E / 'publish-file-list.json').read_text())
assert paths and len(set(paths)) == len(paths), 'manifest_empty_or_duplicate'
assert all(name.startswith('qa/we-handshake-20261115/') for name in paths), 'publication_scope_escape'
assert all((ROOT / name).is_file() for name in paths), 'publication_file_missing'
audit = json.loads((E / 'publish-secret-audit.json').read_text())
assert audit['passed'] is True and not audit['hits'], 'secret_audit_failed'
run(['git', 'add', '--', *paths])
staged = run(['git', 'diff', '--cached', '--name-only']).decode().splitlines()
assert sorted(staged) == sorted(paths), 'stage_manifest_mismatch'
run(['git', 'diff', '--cached', '--check'])
print(json.dumps({'staged_files': len(staged), 'manifest_exact': True,
                  'product_source_staged': False, 'commit_not_created': True}))
