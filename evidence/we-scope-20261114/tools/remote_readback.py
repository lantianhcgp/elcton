"""Read the exact public branch and every published evidence blob; no remote writes."""
import hashlib
import json
import subprocess
import sys
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

REPO = 'lantianhcgp/elcton'
BRANCH = 'fix/we-scope-118599721-20261114'
BASE_COMMIT = '851537a9fade0e941f7a20f4078a04c90f2d2343'
DIRECTORY = 'evidence/we-scope-20261114/'
WORKTREE = Path(__file__).resolve().parents[3]
DELIVERY = Path('/storage/emulated/0/Documents/elcton-WearEngine-真机联调-20261113-123000')


def command(args):
    completed = subprocess.run(args, cwd=WORKTREE, capture_output=True)
    if completed.returncode:
        raise RuntimeError('Readback command failed; raw stderr suppressed')
    return completed.stdout


def api(path):
    return json.loads(command(['gh', 'api', path]))


commit = command(['git', 'rev-parse', 'HEAD']).decode().strip()
ref = api(f'repos/{REPO}/git/ref/heads/{BRANCH}')
assert ref['object']['sha'] == commit
info = api(f'repos/{REPO}')
assert info['private'] is False and info['full_name'] == REPO
remote_tree = api(f'repos/{REPO}/git/trees/{commit}?recursive=1')
assert remote_tree.get('truncated') is False
remote = {item['path']: item for item in remote_tree['tree']
          if item['type'] == 'blob' and item['path'].startswith(DIRECTORY)}
local_paths = [path.decode() for path in command(
    ['git', 'ls-files', '-z', '--', DIRECTORY]).split(b'\0') if path]
assert set(local_paths) == set(remote)
changes = command(['git', 'diff', '--name-status', '-z', BASE_COMMIT, commit]).split(b'\0')
assert changes[-1] == b''
changes = changes[:-1]
assert changes and len(changes) % 2 == 0
pairs = zip(changes[::2], changes[1::2])
assert all(status == b'A' and path.decode().startswith(DIRECTORY) for status, path in pairs)


def read_blob(path):
    expected = (WORKTREE / path).read_bytes()
    object_hash = hashlib.sha1(f'blob {len(expected)}\0'.encode() + expected).hexdigest()
    assert remote[path]['sha'] == object_hash, 'Remote tree hash mismatch'
    url = f'https://raw.githubusercontent.com/{REPO}/{commit}/{urllib.parse.quote(path, safe="/")}'
    error = None
    for _ in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'scope-evidence-readback/1'})
            with urllib.request.urlopen(request, timeout=25) as response:
                actual = response.read()
                status = response.status
            assert status == 200 and actual == expected, 'Remote bytes mismatch'
            return {'path': path, 'http_status': status, 'bytes': len(actual),
                    'sha256': hashlib.sha256(actual).hexdigest(), 'remote_blob_sha': object_hash,
                    'remote_equals_local': True}
        except Exception as exc:
            error = type(exc).__name__
    raise RuntimeError(f'Public exact-commit readback failed: {path} ({error})')


with ThreadPoolExecutor(max_workers=4) as pool:
    records = sorted(pool.map(read_blob, local_paths), key=lambda value: value['path'])
report_relative = DIRECTORY + 'Scope修复报告.md'
report_record = next(value for value in records if value['path'] == report_relative)
report_path = DELIVERY / 'Scope修复报告.md'
assert report_path.exists() and hashlib.sha256(report_path.read_bytes()).hexdigest() == report_record['sha256']
result = {'checked_at': datetime.now().astimezone().isoformat(), 'repo': REPO, 'visibility': 'PUBLIC',
          'branch': BRANCH, 'commit': commit, 'remote_ref_matches': True,
          'evidence_file_count': len(records), 'remote_tree_count': len(remote),
          'every_file_http200_equals_local': True, 'no_app_code_changes': True,
          'report_local_path': str(report_path), 'report_sha256': report_record['sha256'],
          'report_url': f'https://github.com/{REPO}/blob/{commit}/{report_relative}',
          'scope_fixed': False, 'scope_mutations': 0, 'records': records}
output = DELIVERY / 'Scope修复远端读回.json'
output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({key: value for key, value in result.items() if key != 'records'}, ensure_ascii=False, indent=2))
print('Readback receipt: ' + str(output))
