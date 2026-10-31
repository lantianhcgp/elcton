#!/usr/bin/env python3
"""Verify the exact profile, CMS signer identity and hash binding to the complete HAP.

Usage: python3 verify_sign.py <hap> [expected.p7b]
The public profile is verified cryptographically (-noverify: no host trust-store
claim). Device authorization and Huawei chain policy are separate real-device gates.
No private signing material is read by this verifier.
"""
import hashlib
import json
import os
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import time
import zipfile


def openssl(arguments, data=None):
    result = subprocess.run(['openssl'] + arguments, input=data, capture_output=True, timeout=60)
    if result.returncode:
        detail = result.stderr.decode(errors='replace').strip().splitlines()
        raise ValueError('OpenSSL verification failed: ' + (detail[-1] if detail else 'unknown error'))
    return result.stdout


def verify(hap, expected_profile=None):
    with zipfile.ZipFile(hap) as archive:
        if archive.namelist() != ['signed.bin']:
            raise ValueError('Unexpected signed HAP entries')
        raw = archive.read('signed.bin')
    if len(raw) < 64 or raw[-32:-16] != b'hw signed app   ' or raw[-16:-12] != b'1000':
        raise ValueError('Missing or invalid signHead')
    block_size, block_type = struct.unpack_from('>II', raw, len(raw) - 12)
    unsigned_end = len(raw) - block_size
    if block_type != 2 or unsigned_end <= 0 or unsigned_end + 16 >= len(raw) - 32:
        raise ValueError('Invalid signing block bounds')
    profile_type, profile_tag, profile_length, profile_start = struct.unpack_from('>BBHI', raw, unsigned_end)
    cms_type, cms_tag, cms_length, cms_start = struct.unpack_from('>BBHI', raw, unsigned_end + 8)
    if (profile_type, profile_tag, cms_type, cms_tag, cms_length) != (2, 0, 0, 0, 0):
        raise ValueError('Unexpected signing block table')
    if profile_start != unsigned_end + 16 or cms_start != profile_start + profile_length:
        raise ValueError('Invalid profile/CMS offsets')
    if not profile_length or cms_start >= len(raw) - 32:
        raise ValueError('Empty profile or CMS')
    profile = raw[profile_start:cms_start]
    if expected_profile is not None and Path(expected_profile).read_bytes() != profile:
        raise ValueError('Embedded profile does not match the explicitly requested profile')
    cms = raw[cms_start:-32]
    with tempfile.TemporaryDirectory() as temporary:
        signer_path = str(Path(temporary) / 'cms-signer.pem')
        content = openssl(['cms', '-verify', '-binary', '-inform', 'DER', '-noverify',
                           '-purpose', 'any', '-signer', signer_path], cms)
        profile_content = openssl(['cms', '-verify', '-binary', '-inform', 'DER',
                                   '-noverify', '-purpose', 'any'], profile)
        document = json.loads(profile_content)
        leaf = document['bundle-info']['development-certificate'].encode()
        validity = document['validity']
        now = time.time()
        if not validity['not-before'] <= now < validity['not-after']:
            raise ValueError('Profile is not currently valid')
        signer = Path(signer_path).read_bytes()
        if signer.count(b'-----BEGIN CERTIFICATE-----') != 1:
            raise ValueError('Expected exactly one CMS signer')
        profile_public = openssl(['x509', '-pubkey', '-noout'], leaf)
        signer_public = openssl(['x509', '-pubkey', '-noout'], signer)
        if profile_public != signer_public:
            raise ValueError('CMS signer public key differs from the profile leaf')
        leaf_der = openssl(['x509', '-outform', 'DER'], leaf)
        signer_der = openssl(['x509', '-outform', 'DER'], signer)
        if leaf_der != signer_der:
            raise ValueError('CMS signer certificate differs from the profile leaf')
    slices = [hashlib.sha256(raw[index:min(index + 4096, cms_start)]).digest()
              for index in range(0, cms_start, 4096)]
    digest = hashlib.sha256(b''.join(slices)).digest()
    expected = bytearray(b'\x31\x30\x30\x30\x00\x00\x00\x01\x00\x88\x00\x06\x00\x00\x00\x00')
    struct.pack_into('>H', expected, 4, 16 + len(digest))
    struct.pack_into('>I', expected, 12, len(digest))
    expected.extend(digest)
    if content != bytes(expected):
        raise ValueError('CMS content digest is not bound to the current package bytes')
    public_der = openssl(['pkey', '-pubin', '-outform', 'DER'], profile_public)
    return {'cms_bytes': len(cms), 'package_bytes': len(raw),
            'bundle': document['bundle-info']['bundle-name'],
            'public_key_sha256': hashlib.sha256(public_der).hexdigest(),
            'profile_exact': expected_profile is not None, 'payload_digest_bound': True}


def main():
    if len(sys.argv) not in (2, 3):
        print('Usage: verify_sign.py <hap> [expected.p7b]')
        return 2
    try:
        result = verify(sys.argv[1], sys.argv[2] if len(sys.argv) == 3 else None)
    except (ValueError, OSError, KeyError, struct.error, zipfile.BadZipFile, subprocess.TimeoutExpired) as error:
        print('FAIL: signed package verification: ' + str(error))
        return 1
    print('PASS: CMS/profile identity and full package digest verified ' + json.dumps(result))
    return 0


if __name__ == '__main__':
    sys.exit(main())
