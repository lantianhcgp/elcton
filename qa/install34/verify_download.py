#!/usr/bin/env python3
"""Independently bind local signed bytes to exact CI native-parse evidence.
Only reads public artifacts/profile. Never signs or invokes devices.
"""
import hashlib
import json
from pathlib import Path
import runpy
import sys

ROOT = Path(__file__).resolve().parents[2]
sha256 = lambda b: hashlib.sha256(b).hexdigest()


def verify(evidence):
    receipt = json.loads(evidence.read_text())
    source = receipt['source_sha']
    gate = json.loads((evidence.parent / ('final-gate-ci-' + source[:8] + '.json')).read_text())
    app, hap = Path(receipt['app']), Path(receipt['hap'])
    assert app.is_file() and hap.is_file()
    local = runpy.run_path(str(ROOT / 'qa/install34/final_gate.py'))['verify'](app, hap)
    # The local no-SDK mode is static-only; this branch never re-labels it native.
    assert local['native_sdk_sha256'] is None and local['native_parse'] == []
    for key in ['hap_sha256', 'app_sha256', 'bundle', 'version', 'profile_sha256',
                'cms', 'chain', 'one_byte_negative_rejected', 'signed_ast_passed',
                'resource_count', 'resources', 'pages', 'js']:
        assert local[key] == gate[key], 'Local/CI evidence mismatch: ' + key
    assert sha256(hap.read_bytes()) == receipt['hap_sha256'] == gate['hap_sha256']
    assert sha256(app.read_bytes()) == receipt['app_sha256'] == gate['app_sha256']
    assert gate['native_sdk_sha256'] == '7cb8af6c01f4848216f429bf35d1d497734ee299e055f3f93d58a4d176cfda31'
    expected = {r['path']: r['sha256'] for r in local['js']}
    native = gate['native_parse']
    assert len(native) == 7 and len({r['path'] for r in native}) == 7
    assert {r['path']: r['sha256'] for r in native} == expected
    assert all(r['returncode'] == 0 and r['stderr'] == '' for r in native)
    unpack = runpy.run_path(str(ROOT / 'qa/verify_final_artifacts.py'))['unpack_signed']
    baseline = json.loads((ROOT / 'qa/install34/evidence/package-comparison.json').read_text())['samples']['timerfix']
    old = Path(baseline['path'])
    assert sha256(old.read_bytes()) == baseline['sha256'] == 'e61ea7189ce342bdefc905d15c131d6c5ce8cbf0b8169f26a5dfb98441ca4b1d'
    old_bundle, before, _ = unpack(old)
    bundle, after, _ = unpack(hap)
    assert bundle == old_bundle == 'watchapp.nexus.0zzip'
    assert list(after) == list(before) == baseline['file_order'], 'Resource order changed'
    changed, equal = [], []
    allowed_metadata = {'config.json', 'pack.info', 'assets/js/MainAbility/manifest.json'}
    for path, content in after.items():
        record = {'path': path, 'before_bytes': len(before[path]), 'after_bytes': len(content),
                  'before_sha256': sha256(before[path]), 'after_sha256': sha256(content)}
        if content == before[path]:
            equal.append(record)
            continue
        assert path in allowed_metadata or path.endswith(('.js', '.js.map')), 'Noncode resource changed: ' + path
        if path in allowed_metadata:
            a, b = json.loads(before[path]), json.loads(content)
            if path == 'config.json':
                a['app']['version'] = {'code': 1000117, 'name': '1.1.14'}
            elif path == 'pack.info':
                a['summary']['app']['version'] = {'code': 1000117, 'name': '1.1.14'}
            else:
                a['versionCode'], a['versionName'] = 1000117, '1.1.14'
            assert a == b, 'Metadata change beyond version: ' + path
        changed.append(record)
    assert after['assets/js/MainAbility/app.js'] == before['assets/js/MainAbility/app.js']
    retain = json.loads((ROOT / 'qa/install34/evidence/retained-boundaries-e62fe50.json').read_text())
    assert all(sha256((ROOT / r['path']).read_bytes()) == r['sha256'] for r in retain)
    result = {'passed': True, 'source_sha': source, 'run_id': receipt['run_id'],
              'hap_sha256': local['hap_sha256'], 'app_sha256': local['app_sha256'],
              'local_static_signing_and_ast_passed': True,
              'native_parse_location': 'Exact CI runner; not re-executed in Termux',
              'native_sdk_sha256': gate['native_sdk_sha256'], 'native_all_files_bound': True,
              'native_js_files': len(native), 'resource_set_and_order_preserved': True,
              'resource_count': len(after), 'version': local['version'],
              'profile_sha256': local['profile_sha256'], 'chain_passed': local['chain'],
              'one_byte_negative_rejected': local['one_byte_negative_rejected'],
              'largest_js_bytes': max(r['bytes'] for r in local['js']),
              'changed_resources': changed, 'unchanged_resources': equal,
              'source_boundaries_unchanged': retain,
              'device_installation_tested': False,
              'scope': 'Exact bytes/cryptography/SDK parse only; FIT3 install34, UI, heap and Wear Engine E2E pending user'}
    out = evidence.parent / ('local-artifact-proof-' + source[:8] + '.json')
    with out.open('x') as f:
        f.write(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k not in ['changed_resources', 'unchanged_resources', 'source_boundaries_unchanged']}))


if __name__ == '__main__':
    verify(Path(sys.argv[1]))
