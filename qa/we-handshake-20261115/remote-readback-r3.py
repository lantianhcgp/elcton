#!/usr/bin/env python3
"""Read back exact committed R3 evidence via GitHub; no write or key output.
Usage: python remote-readback-r3.py <commit> <candidate-list.json> <report.json>
"""
import base64
import concurrent.futures
import hashlib
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REPO = 'repos/lantianhcgp/elcton'


def api(endpoint):
    last = None
    for attempt in range(3):
        try:
            proc = subprocess.run(['gh', 'api', endpoint], capture_output=True, timeout=35)
            if proc.returncode == 0:
                return json.loads(proc.stdout)
            last = 'github_api_exit_' + str(proc.returncode)
        except (subprocess.TimeoutExpired, ValueError):
            last = 'github_api_timeout_or_json'
        if attempt < 2:
            time.sleep(1 + attempt)
    raise RuntimeError(last)


def local_blob(commit, path):
    return subprocess.check_output(['git', 'show', commit + ':' + path], cwd=ROOT)


def verify_one(item, commit):
    path, oid = item
    remote = api(REPO + '/git/blobs/' + oid)
    if remote.get('sha') != oid or remote.get('encoding') != 'base64':
        raise ValueError('remote_blob_identity_or_encoding')
    decoded = base64.b64decode(remote['content'])
    local = local_blob(commit, path)
    gitsha = hashlib.sha1(b'blob ' + str(len(decoded)).encode() + b'\0' + decoded).hexdigest()
    if gitsha != oid or decoded != local:
        raise ValueError('remote_committed_byte_mismatch')
    return {'path': path, 'git_blob': oid, 'bytes': len(decoded),
            'sha256': hashlib.sha256(decoded).hexdigest(), 'byte_equal': True}


def main():
    commit, candidate, report = sys.argv[1:4]
    if len(commit) != 40 or any(c not in '0123456789abcdef' for c in commit):
        raise ValueError('literal_commit_format')
    paths = json.loads(Path(candidate).read_text())
    if not paths or len(paths) != len(set(paths)):
        raise ValueError('candidate_list_empty_or_duplicate')
    head = api(REPO + '/git/ref/heads/fix/we-handshake-logger-20261115')['object']['sha']
    if head != commit:
        raise ValueError('branch_head_drift')
    tree = api(REPO + '/git/trees/' + commit + '?recursive=1')
    if tree.get('truncated'):
        raise ValueError('remote_tree_truncated')
    blobs = {x['path']: x['sha'] for x in tree['tree'] if x['type'] == 'blob'}
    if any(path not in blobs for path in paths):
        raise ValueError('remote_candidate_missing')
    rows, failures = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        pending = {pool.submit(verify_one, (p, blobs[p]), commit): p for p in paths}
        for future in concurrent.futures.as_completed(pending):
            try:
                rows.append(future.result())
            except Exception as error:
                failures.append({'path': pending[future], 'code': type(error).__name__})
    rows.sort(key=lambda x: x['path'])
    passed = not failures and len(rows) == len(paths)
    result = {'passed': passed, 'commit': commit, 'remote_branch_head_exact': True,
              'requested_files': len(paths), 'verified_files': len(rows),
              'bytes_read_back': sum(r['bytes'] for r in rows), 'rows': rows,
              'failures': failures, 'credential_values_printed': False,
              'verified_at': time.strftime('%Y-%m-%d %H:%M:%S %z')}
    Path(report).parent.mkdir(parents=True, exist_ok=True)
    Path(report).write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k not in ('rows', 'failures')}))
    return 0 if passed else 1


if __name__ == '__main__':
    raise SystemExit(main())
