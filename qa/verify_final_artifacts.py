#!/usr/bin/env python3
"""Read the exact signed HAP file table and compare it to the exercised original .app.

Host-only. No private key is read. Device authorization is not verified here.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import struct
import subprocess
import zipfile


def unpack_signed(hap):
    with zipfile.ZipFile(hap) as archive:
        assert archive.namelist() == ['signed.bin'], 'Unexpected signed HAP entries'
        raw = archive.read('signed.bin')
    assert raw[:1] == b'\xbe', 'Bad file-table magic'
    assert raw[-32:-16] == b'hw signed app   ', 'Missing signature header'
    stop = len(raw) - struct.unpack_from('>I', raw, len(raw) - 12)[0]
    cursor = 1
    def field(size):
        nonlocal cursor
        assert 0 <= size <= stop - cursor, 'File-table field exceeds payload bounds'
        content = raw[cursor:cursor+size]
        cursor += size
        return content
    def u32():
        return struct.unpack('>I', field(4))[0]
    bundle = field(u32()).decode('utf8')
    entries = {}
    while cursor < stop:
        name = field(u32()).decode('utf8')
        directory = field(u32()).decode('utf8')
        size = struct.unpack('>Q', field(8))[0]
        assert name and '/' not in name and '\\' not in name, 'Invalid payload basename'
        key = directory.lstrip('/') + ('/' if directory else '') + name
        assert key not in entries and '..' not in key.split('/'), 'Duplicate or unsafe file-table path'
        entries[key] = field(size)
    assert cursor == stop and entries, 'Incomplete signed file table'
    return bundle, entries, raw


def verify(app, hap, profile, source_version, phone_identity, phone_signature, phone_source):
    signer_script = Path(__file__).resolve().parents[1] / 'tools/sign/verify_sign.py'
    cms = subprocess.run(['python', str(signer_script), str(hap), str(profile)],
                         capture_output=True, text=True, timeout=90)
    assert cms.returncode == 0, cms.stdout + cms.stderr
    with zipfile.ZipFile(app) as archive:
        inner = [n for n in archive.namelist() if n.endswith('.hap')]
        assert len(inner) == 1, 'Expected exactly one entry HAP'
        with zipfile.ZipFile(io.BytesIO(archive.read(inner[0]))) as entry:
            original = {n: entry.read(n) for n in entry.namelist() if not n.endswith('/')}
    bundle, saved, signed_raw = unpack_signed(hap)
    assert set(saved) == set(original), 'Signed package entry set differs from original app'
    expected_config = json.loads(original['config.json'])
    source = json.loads(source_version.read_text())
    assert expected_config['app']['version'] == source['app']['version'], 'Original app version mismatch'
    expected_config['app']['bundleName'] = bundle
    signed_config = json.loads(saved['config.json'])
    assert signed_config == expected_config, 'Signer changed config beyond the requested application identity'
    assert bundle == 'watchapp.nexus.0zzip', 'Wrong final watch identity'
    assert signed_config['deviceConfig'] == {}, 'Debug deviceConfig reached signed HAP'
    assert signed_config['app']['apiVersion']['compatible'] == 40000010
    changes = []
    for name, content in saved.items():
        if name == 'config.json':
            continue
        assert content == original[name], 'Signed payload mismatch: ' + name
        if name.endswith('.js'):
            assert not re.search(rb'(?<![\w$])require\s*\(', content), 'External require: ' + name
            if '/pages/' in name:
                assert len(content) < 49152, 'Lite page exceeds code budget: ' + name
        changes.append({'name': name, 'bytes': len(content), 'sha256': hashlib.sha256(content).hexdigest()})
    with zipfile.ZipFile(hap) as archive:
        raw = archive.read('signed.bin')
    unsigned_end = len(raw) - struct.unpack_from('>I', raw, len(raw)-12)[0]
    _, _, profile_len, profile_start = struct.unpack_from('>BBHI', raw, unsigned_end)
    public_profile = raw[profile_start:profile_start+profile_len]
    result = subprocess.run(['openssl','cms','-verify','-inform','DER','-noverify','-purpose','any'],
                            input=public_profile,capture_output=True,timeout=30)
    assert result.returncode == 0, 'Profile CMS verification failed'
    from cryptography import x509
    from cryptography.hazmat.primitives import hashes
    leaf = x509.load_pem_x509_certificate(json.loads(result.stdout)['bundle-info']['development-certificate'].encode())
    watch_fingerprint = leaf.fingerprint(hashes.SHA256()).hex()
    watch_match = re.search(r'watchFingerprint="([0-9a-f]{64})"', phone_source.read_text())
    assert watch_match is not None, 'Phone source has no explicit watch peer identity'
    assert watch_match.group(1) == watch_fingerprint, 'APK source peer fingerprint mismatches the signed HAP'
    phone_match = re.search(r'certificate SHA-256 digest: ([0-9a-fA-F]{64})',phone_signature.read_text())
    expected_match = re.search(r"phoneFingerprint:\s*'([0-9a-f]{64})'",phone_identity.read_text())
    assert phone_match is not None and expected_match is not None, 'Missing explicit phone signing identity'
    phone_fingerprint = phone_match.group(1).lower()
    assert phone_fingerprint == expected_match.group(1), 'Signed APK fingerprint mismatches the watch source identity'
    return {'passed': True, 'watch_bundle': bundle, 'watch_version': signed_config['app']['version'],
            'watch_fingerprint':watch_fingerprint, 'phone_fingerprint':phone_fingerprint,
            'unchanged_resources':len(changes),'original_app_sha256':hashlib.sha256(app.read_bytes()).hexdigest(),
            'signed_hap_sha256':hashlib.sha256(hap.read_bytes()).hexdigest(),
            'signed_payload_sha256':hashlib.sha256(signed_raw).hexdigest(),
            'config_only_change':'app.bundleName: com.hcbiu.elcton -> watchapp.nexus.0zzip',
            'resources':changes,'cms_result':cms.stdout.strip(),
            'scope':'Artifact bytes and public identities only; no physical Wear Engine/device install claimed'}


def main():
    parser=argparse.ArgumentParser()
    for name in ['app','hap','profile','source-version','phone-identity','phone-signature','phone-source','output']:
        parser.add_argument('--'+name, type=Path, required=True)
    args=parser.parse_args()
    result=verify(args.app,args.hap,args.profile,args.source_version,args.phone_identity,args.phone_signature,args.phone_source)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(json.dumps({k:v for k,v in result.items() if k not in ['resources','cms_result']},ensure_ascii=False))

if __name__ == '__main__':
    main()
