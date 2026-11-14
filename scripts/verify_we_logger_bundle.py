#!/usr/bin/env python3
"""Additional public CI APP logger/shape gate; existing byte/sign gates stay frozen."""
import io
import json
from pathlib import Path
import re
import sys
import zipfile

PREFIX = 'assets/js/MainAbility/'
PUBLIC_ENDPOINT = b'https://example.invalid/ELCTON_WE_LOG_ENDPOINT_PLACEHOLDER_20261115'
PUBLIC_KEY = b'ELCTON_WE_WRITE_KEY_PLACEHOLDER_20261115'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def archive(data):
    with zipfile.ZipFile(data) as z:
        names = z.namelist()
        require(len(names) == len(set(names)), 'Duplicate ZIP path')
        require(z.testzip() is None, 'ZIP CRC failed')
        require(all(not n.startswith('/') and '\\' not in n and
                    all(part not in ('.', '..') for part in n.split('/')) for n in names), 'Unsafe ZIP path')
        return {n: z.read(n) for n in names if not n.endswith('/')}


def verify(app):
    outer = archive(app)
    haps = [n for n in outer if n.endswith('.hap')]
    require(len(haps) == 1, 'Expected exactly one actual APP HAP')
    files = archive(io.BytesIO(outer[haps[0]]))
    require(not any(n.lower().endswith('.bc') or b.startswith(b'JRRY') for n, b in files.items()), 'Bytecode refused before local configuration')
    cfg = json.loads(files['config.json'])
    manifest = json.loads(files[PREFIX + 'manifest.json'])
    pages = cfg['module']['js'][0]['pages']
    version = cfg['app']['version']
    require(manifest['pages'] == pages and len(pages) == len(set(pages)), 'Manifest/real page set differs')
    require((manifest['versionCode'], manifest['versionName']) == (version['code'], version['name']), 'Manifest version differs')
    js = {n: b for n, b in files.items() if n.endswith('.js')}
    require(set(js) == {PREFIX + 'app.js'} | {PREFIX + p + '.js' for p in pages}, 'Actual JS set differs from manifest')
    for name, b in js.items():
        require(b and len(b) < 49152, 'Existing nonempty/48KiB budget failed: ' + name)
        require(not b.startswith(b'\x1f\x8b'), 'Gzip refused before local configuration')
        require(not re.search(rb'require\s*\(\s*[\'"](?:@babel/runtime|\.)', b), 'Unbundled external dependency: ' + name)
        require(not re.search(rb'\b(?:import|export)\s', b), 'Unbundled module declaration: ' + name)
        require(b'PRIVATE KEY-----' not in b, 'Signing material marker in actual JS')
    app_js = js[PREFIX + 'app.js']
    for token in (b'X-Log-Key', PUBLIC_ENDPOINT, PUBLIC_KEY, b'console', b'@system.fetch'):
        require(token in app_js, 'Actual application logger feature/placeholder absent')
    require(re.search(rb'\.init\s*\(', app_js) and re.search(rb'\.page\s*\(', app_js) and b'MainAbility' in app_js,
            'Actual logger lifecycle invocation absent')
    ver_literal = ('ver:"' + version['name'] + '"').encode()
    require(ver_literal in app_js or ('"ver":"' + version['name'] + '"').encode() in app_js or
            ("ver:'" + version['name'] + "'").encode() in app_js, 'Logger/source version mismatch')
    for stage in (b'SDK_CALL', b'VER_OK', b'PKG_OK', b'CERT_OK', b'REG_OK', b'SEND_FAIL', b'READY_FAIL'):
        require(stage in app_js, 'Actual application stage missing')
    receive = js[PREFIX + 'pages/phone-sync/phone-sync.js']
    require(b'HELLO_RECV' in receive and b'READY_PREPARED' in receive, 'Actual receive page stages absent')
    require(b'@system.brightness' in receive and b'keepScreenOn' in receive and b'KEEP_ON' in receive,
            'Actual keep-screen-on API/marker absent')
    # Value must remain the exact public placeholder, never an accidental real key.
    require(re.search(rb'(?:[\'"]key[\'"]|\bkey)\s*:\s*[\'"]' + re.escape(PUBLIC_KEY) + rb'[\'"]', app_js),
            'Public runtime key not exact placeholder')
    return {'passed': True, 'public_only': True, 'bytecode_absent': True, 'gzip_absent': True,
            'version': version, 'pages': pages, 'js': [{'path': n, 'bytes': len(b)} for n, b in sorted(js.items())],
            'scope': 'Actual compiled package bytes/features only; not on-watch brightness, Bluetooth, HTTP ACK or heap acceptance'}


if __name__ == '__main__':
    try:
        print(json.dumps(verify(Path(sys.argv[1]))))
    except (ValueError, OSError, KeyError, TypeError, zipfile.BadZipFile, IndexError):
        raise SystemExit('FAIL: actual public APP logger/shape gate (payload and credential details suppressed)')
