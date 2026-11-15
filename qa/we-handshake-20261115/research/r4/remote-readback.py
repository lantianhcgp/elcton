#!/usr/bin/env python3
"""Read exact R4 GitHub blobs at a pinned commit. No remote writes or key output."""
from pathlib import Path
import base64
import concurrent.futures
import hashlib
import json
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[4]
REPO = 'repos/lantianhcgp/elcton'
BRANCH = 'fix/we-handshake-logger-20261115'


def api(endpoint):
    for attempt in range(3):
        try:
            result = subprocess.run(['gh', 'api', endpoint], cwd=ROOT, capture_output=True, timeout=35)
            if result.returncode == 0:
                return json.loads(result.stdout)
        except (subprocess.TimeoutExpired, ValueError):
            pass
        if attempt < 2:
            time.sleep(1 + attempt)
    raise RuntimeError('remote_api_failed')


def main():
    commit, manifest, report_path = sys.argv[1:]
    assert len(commit) == 40 and all(c in '0123456789abcdef' for c in commit), 'literal_commit_format'
    paths = json.loads(Path(manifest).read_text())
    assert paths and len(paths) == len(set(paths)), 'manifest_empty_or_duplicate'
    assert all(p.startswith('qa/we-handshake-20261115/') for p in paths), 'scope_escape'
    head = api(REPO + '/git/ref/heads/' + BRANCH)['object']['sha']
    assert head == commit, 'remote_head_drift'
    tree = api(REPO + '/git/trees/' + commit + '?recursive=1')
    assert not tree.get('truncated'), 'remote_tree_truncated'
    blobs = {row['path']: row['sha'] for row in tree['tree'] if row['type'] == 'blob'}
    assert all(p in blobs for p in paths), 'remote_file_missing'

    def one(path):
        oid = blobs[path]
        remote = api(REPO + '/git/blobs/' + oid)
        assert remote['sha'] == oid and remote['encoding'] == 'base64', 'remote_blob_shape'
        data = base64.b64decode(remote['content'])
        source = subprocess.check_output(['git', 'show', commit + ':' + path], cwd=ROOT)
        calculated = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        assert calculated == oid and source == data, 'remote_byte_mismatch'
        return {'path': path, 'git_blob': oid, 'bytes': len(data),
                'sha256': hashlib.sha256(data).hexdigest(), 'byte_equal': True}

    rows, failures = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(one, path): path for path in paths}
        for future in concurrent.futures.as_completed(futures):
            try:
                rows.append(future.result())
            except Exception as error:
                failures.append({'path': futures[future], 'error_class': type(error).__name__})
    result = {'passed': not failures and len(rows) == len(paths), 'commit': commit,
              'remote_branch_head_exact': True, 'requested_files': len(paths),
              'verified_files': len(rows), 'bytes_read_back': sum(row['bytes'] for row in rows),
              'rows': sorted(rows, key=lambda row: row['path']), 'failures': failures,
              'credential_values_printed': False,
              'verified_at': time.strftime('%Y-%m-%d %H:%M:%S %z')}
    target = Path(report_path)
    assert target.resolve() not in {(ROOT / path).resolve() for path in paths}, 'receipt_overwrites_source'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({key: value for key, value in result.items() if key not in ('rows', 'failures')}))
    return 0 if result['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
