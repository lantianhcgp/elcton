#!/usr/bin/env python3
"""Bounded, exact-head CI wait. No job dispatch, credentials or device operations."""
import json
from pathlib import Path
import subprocess
import sys
import time

sha, workflow, minutes = sys.argv[1], sys.argv[2], int(sys.argv[3])
assert len(sha) == 40 and all(c in '0123456789abcdef' for c in sha)
assert 0 < minutes <= 30
out = Path(__file__).parent / 'evidence' / ('ci-' + workflow.removesuffix('.yml') + '-' + sha[:8] + '.json')
deadline = time.monotonic() + minutes * 60
last = None
while time.monotonic() < deadline:
    p = subprocess.run(['gh', 'run', 'list', '--repo', 'lantianhcgp/elcton', '--commit', sha,
                        '--workflow', workflow, '--limit', '10', '--json',
                        'databaseId,headSha,status,conclusion,url,event'], capture_output=True, timeout=40)
    if p.returncode:
        raise SystemExit('GitHub read failed; raw output suppressed')
    rows = json.loads(p.stdout)
    rows = [r for r in rows if r['headSha'] == sha]
    if len(rows) > 1:
        raise SystemExit('Multiple same-head runs; select an exact run manually')
    if rows:
        row = rows[0]
        state = (row['databaseId'], row['status'], row['conclusion'])
        if state != last:
            print(json.dumps(row), flush=True)
            last = state
        if row['status'] == 'completed':
            out.write_text(json.dumps(row, indent=2) + '\n')
            raise SystemExit(0 if row['conclusion'] == 'success' else 1)
    time.sleep(20)
raise SystemExit('Exact-head CI wait reached its explicit deadline')
