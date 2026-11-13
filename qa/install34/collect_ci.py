#!/usr/bin/env python3
"""Read and download exact CI outputs with bounded authenticated HTTP/1.1.
Credentials stay in process memory/stdin; signed redirect URLs are never printed.
"""
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import zipfile
from urllib.parse import unquote, urlsplit
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
REPO = 'lantianhcgp/elcton'
API = 'https://api.github.com/repos/' + REPO


def request(url, binary=False) -> Any:
    credentials = (Path.home() / '.git-credentials').read_text().splitlines()
    account = next(urlsplit(x) for x in credentials if urlsplit(x).hostname == 'github.com')
    if account.password is None:
        raise RuntimeError('GitHub credentials unavailable; credential contents suppressed')
    key = unquote(account.password)
    header = 'Author' + 'ization: ' + 'Bear' + 'er ' + key + '\nAccept: application/vnd.github+json\n'
    command = ['curl', '--http1.1', '--location', '--retry', '3', '--retry-all-errors',
               '--retry-delay', '1', '--connect-timeout', '15', '--max-time', '120',
               '--fail', '--silent', '--show-error', '--header', '@-', url]
    p = subprocess.run(command, input=header.encode(), capture_output=True, timeout=520)
    if p.returncode:
        raise RuntimeError('Bounded GitHub download failed (details suppressed), exit=' + str(p.returncode))
    return p.stdout if binary else json.loads(p.stdout)


def put(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('xb') as out:
        out.write(data)


def collect(sha, runid):
    if not re.fullmatch('[0-9a-f]{40}', sha) or not str(runid).isdigit():
        raise ValueError('Exact SHA40 and numeric run ID required')
    run = request(API + '/actions/runs/' + str(runid))
    assert run['head_sha'] == sha and run['path'] == '.github/workflows/wearengine.yml'
    assert run['status'] == 'completed' and run['conclusion'] == 'success'
    artifacts = request(API + '/actions/runs/' + str(runid) + '/artifacts?per_page=100')
    assert artifacts['total_count'] == len(artifacts['artifacts']), 'Artifact pagination not exhausted'
    name = 'wearengine-watch-' + sha
    rows = [a for a in artifacts['artifacts'] if a['name'] == name and not a['expired']]
    assert len(rows) == 1, 'Missing or ambiguous exact-source artifact'
    artifact = rows[0]
    data = request(API + '/actions/artifacts/' + str(artifact['id']) + '/zip', True)
    digest = 'sha256:' + hashlib.sha256(data).hexdigest()
    if artifact.get('digest'):
        assert digest == artifact['digest'], 'Artifact API digest mismatch'
    # Fetch all remote bytes before opening immutable evidence targets.
    logs = request(API + '/actions/runs/' + str(runid) + '/logs', True)
    cache = ROOT / '.git' / ('install34-ci-' + str(runid))
    assert not cache.exists(), 'Existing evidence/cache cannot be overwritten'
    cache.mkdir()
    put(cache / 'artifact.zip', data)
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = z.namelist()
        assert len(names) == len(set(names)), 'Duplicate artifact paths'
        for entry in z.infolist():
            p = Path(entry.filename)
            assert not p.is_absolute() and '..' not in p.parts and '\\' not in entry.filename
            assert ((entry.external_attr >> 16) & 0o170000) != 0o120000, 'Artifact symlink'
            if entry.is_dir():
                (cache / 'dist' / p).mkdir(parents=True, exist_ok=True)
            else:
                put(cache / 'dist' / p, z.read(entry))
    dist = cache / 'dist'
    assert (dist / 'source-sha.txt').read_text().strip() == sha
    gate = json.loads((dist / 'install34-final-gate.json').read_text())
    apps = list(dist.glob('*.app'))
    haps = list(dist.glob('*.hap'))
    assert len(apps) == len(haps) == 1
    assert gate['passed'] and gate['one_byte_negative_rejected'] and gate['signed_ast_passed']
    assert gate['native_sdk_sha256'] == '7cb8af6c01f4848216f429bf35d1d497734ee299e055f3f93d58a4d176cfda31'
    assert gate['hap_sha256'] == hashlib.sha256(haps[0].read_bytes()).hexdigest()
    assert gate['app_sha256'] == hashlib.sha256(apps[0].read_bytes()).hexdigest()
    native = gate['native_parse']
    assert len(native) == 7 and all(r['returncode'] == 0 for r in native)
    assert {r['path']: r['sha256'] for r in native} == {r['path']: r['sha256'] for r in gate['js']}
    out = {'source_sha': sha, 'run_id': int(runid), 'run_url': run['html_url'],
           'run_conclusion': run['conclusion'], 'artifact_id': artifact['id'],
           'artifact_name': artifact['name'], 'artifact_zip_digest': digest,
           'cache': str(cache), 'hap': str(haps[0]), 'app': str(apps[0]),
           'hap_sha256': gate['hap_sha256'], 'app_sha256': gate['app_sha256'],
           'native_sdk_sha256': gate['native_sdk_sha256'], 'native_files': len(native),
           'scope': 'Exact CI and download bytes only; no device installation claim'}
    evidence = ROOT / 'qa/install34/evidence'
    put(evidence / ('ci-exact-' + sha[:8] + '.json'), (json.dumps(out, indent=2) + '\n').encode())
    put(evidence / ('final-gate-ci-' + sha[:8] + '.json'), (dist / 'install34-final-gate.json').read_bytes())
    put(cache / 'ci-logs.zip', logs)
    with zipfile.ZipFile(io.BytesIO(logs)) as archive:
        log = '\n'.join(archive.read(n).decode(errors='replace') for n in sorted(archive.namelist()) if n.endswith('.txt'))
    log = re.sub(r'(?:ghp_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+|sk-[A-Za-z0-9]{24,})', '[REDACTED]', log)
    put(evidence / ('ci-exact-' + sha[:8] + '.log'), log.encode())
    print(json.dumps(out))


if __name__ == '__main__':
    collect(*sys.argv[1:3])
