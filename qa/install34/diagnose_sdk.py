#!/usr/bin/env python3
"""Same-CLT parse controls; does not sign, install, or read any private key."""
import gzip
import hashlib
import json
import os
from pathlib import Path
import runpy
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]
SHA = lambda data: hashlib.sha256(data).hexdigest()

def run(binary, args, timeout=30):
    try:
        p = subprocess.run([str(binary), *map(str, args)], capture_output=True, timeout=timeout)
        return {'returncode': p.returncode, 'stdout': p.stdout.decode(errors='replace'),
                'stderr': p.stderr.decode(errors='replace')}
    except subprocess.TimeoutExpired:
        return {'returncode': None, 'stdout': '', 'stderr': 'TIMEOUT'}

def download(run_id, artifact, folder):
    folder.mkdir(parents=True, exist_ok=False)
    p = subprocess.run(['gh', 'run', 'download', str(run_id), '--repo', 'lantianhcgp/elcton',
                        '--name', artifact, '--dir', str(folder)], capture_output=True, timeout=180)
    if p.returncode:
        raise RuntimeError('Artifact download failed: run=%s exit=%s (raw URL suppressed)' % (run_id, p.returncode))
    haps = list(folder.rglob('*.hap'))
    assert len(haps) == 1, 'Expected exactly one downloaded signed HAP'
    return haps[0]

def diagnose(binary, scratch, samples):
    scratch.mkdir(parents=True, exist_ok=True)
    result = {'scope': 'Host parse evidence only, not device installation or runtime proof',
              'binary': str(binary), 'binary_sha256': SHA(binary.read_bytes()),
              'help': run(binary, ['--help']), 'fixtures': [], 'samples': []}
    fixtures = {
        'plain-es5': "var s='123'; var ok=s.length===3;",
        'literal-test': "var s='123'; var ok=/^[0-9]{3}$/.test(s);",
        'literal-only': 'var r=/^[0-9]{3}$/;',
        'literal-exec': "var s='123'; var ok=/^[0-9]{3}$/.exec(s)!==null;",
        'replace-control': "var s='a\\nb'; var out=s.replace(/[\\r\\n\\t]/g,' ');",
        'dead-test': "if(false){var ok=/^[0-9]{3}$/.test('123');}",
        'char-loop': "var s='123',ok=s.length===3;for(var i=0;i<s.length;i++){var n=s.charCodeAt(i);if(n<48||n>57)ok=false;}"
    }
    for label, source in fixtures.items():
        path = scratch / (label + '.js')
        path.write_text(source)
        result['fixtures'].append({'name': label, 'source': source, 'sha256': SHA(path.read_bytes()),
                                   **run(binary, ['--parse-only', path])})
    unpack = runpy.run_path(str(ROOT / 'qa/verify_final_artifacts.py'))['unpack_signed']
    for label, hap, expected in samples:
        assert SHA(hap.read_bytes()) == expected, 'Signed input hash mismatch: ' + label
        bundle, files, raw = unpack(hap)
        rows = []
        for name, blob in files.items():
            if not name.endswith('.js'):
                continue
            if blob.startswith(b'\x1f\x8b'):
                blob = gzip.decompress(blob)
            path = scratch / label / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(blob)
            rows.append({'path': name, 'bytes': len(blob), 'sha256': SHA(blob),
                         **run(binary, ['--parse-only', path])})
        result['samples'].append({'label': label, 'hap_sha256': expected, 'bundle': bundle, 'js': rows})
    return result

def main():
    scratch = Path(os.environ['RUNNER_TEMP']) / ('install34-' + os.environ['GITHUB_RUN_ID'])
    scratch.mkdir(parents=True, exist_ok=False)
    sdk = Path(os.environ['HOS_SDK_HOME'])
    candidates = [p for p in sdk.rglob('jerry') if p.is_file() and p.parent.name == 'bin' and 'ace-loader' in str(p)]
    assert len(candidates) == 1, 'SDK jerry path is ambiguous or missing: ' + str(candidates)
    good = download(38066700492, 'elcton-54', scratch / 'good-artifact')
    bad = download(43375036523, 'wearengine-watch-9517f345e8d0e0995708b0a5d0b37b4cae8689ac', scratch / 'failed-artifact')
    samples = [('good-1010', good, '16376f777f46333d7920cc20a27f9bd2301321de5503b1aee89bcbf44efe1df0'),
               ('failed-1113', bad, 'e61ea7189ce342bdefc905d15c131d6c5ce8cbf0b8169f26a5dfb98441ca4b1d')]
    result = diagnose(candidates[0], scratch / 'parse', samples)
    result['source_commit'] = os.environ['GITHUB_SHA']
    out = ROOT / 'qa/install34/evidence/native-sdk-control.json'
    out.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))
    assert result['fixtures'][0]['returncode'] == 0, 'Plain ES5 control failed'

if __name__ == '__main__':
    main()
