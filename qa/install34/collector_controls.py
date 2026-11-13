#!/usr/bin/env python3
"""Synthetic collector guards only; never substitute fixtures for CI evidence."""
import runpy
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]
module = runpy.run_path(str(ROOT / 'qa/install34/collect_ci.py'), run_name='control_only')
collect = module['collect']
globals_ = collect.__globals__
sha = 'e62fe509e111a1762f87761694f0c28f506448a7'
rows = []


def rejected(name, supplied_sha, runid, response, expected_calls):
    calls = []
    def fake_request(url, binary=False):
        calls.append(url)
        return response
    globals_['request'] = fake_request
    try:
        collect(supplied_sha, runid)
    except (AssertionError, ValueError):
        assert len(calls) == expected_calls
        rows.append({'name': name, 'rejected': True, 'reads': len(calls)})
    else:
        raise AssertionError('Control unexpectedly accepted: ' + name)


rejected('SHA40 format', 'e62fe50', '43419821130', {}, 0)
rejected('numeric run ID format', sha, '434x', {}, 0)
rejected('wrong exact source', sha, '43419821130', {'head_sha': '0'*40}, 1)
rejected('wrong workflow', sha, '43419821130', {'head_sha': sha, 'path': '.github/workflows/other.yml'}, 1)
rejected('incomplete CI', sha, '43419821130', {'head_sha': sha, 'path': '.github/workflows/wearengine.yml', 'status': 'in_progress'}, 1)
rejected('failed CI', sha, '43419821130', {'head_sha': sha, 'path': '.github/workflows/wearengine.yml', 'status': 'completed', 'conclusion': 'failure'}, 1)
assert not (ROOT / '.git/install34-ci-43419821130').exists()
result = {'synthetic_controls_only': True, 'controls': len(rows), 'passed': len(rows), 'artifact_writes': 0, 'rows': rows,
          'scope': 'Stubbed network response rejection tests; not artifact/native/CMS/installation evidence'}
print(json.dumps(result))
