#!/usr/bin/env python3
"""Verify final HAP bytes against CI APP and exact SDK. No private key/device access."""
import gzip
import hashlib
import io
import json
import os
from pathlib import Path
import runpy
import struct
import subprocess
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from cryptography.hazmat.primitives.serialization import pkcs7, Encoding

ROOT = Path(__file__).resolve().parents[2]
SHA = lambda data: hashlib.sha256(data).hexdigest()
UNPACK = runpy.run_path(str(ROOT / 'qa/verify_final_artifacts.py'))['unpack_signed']
VERIFY = runpy.run_path(str(ROOT / 'tools/sign/verify_sign.py'))['verify']
PROFILE_SHA = '29675fba03bc5be63ba4072c4ab0daec58090c9df3447496b52892c6dd0c764e'
SDK_SHA = '7cb8af6c01f4848216f429bf35d1d497734ee299e055f3f93d58a4d176cfda31'

def app_files(app):
    with zipfile.ZipFile(app) as outer:
        haps = [n for n in outer.namelist() if n.endswith('.hap')]
        assert len(haps) == 1, 'Ambiguous APP entry'
        with zipfile.ZipFile(io.BytesIO(outer.read(haps[0]))) as inner:
            assert len(inner.namelist()) == len(set(inner.namelist())), 'Duplicate ZIP entry'
            return {n: inner.read(n) for n in inner.namelist() if not n.endswith('/')}

def chain_check(raw, baseline):
    stop = len(raw) - struct.unpack_from('>I', raw, len(raw)-12)[0]
    _, _, _, offset = struct.unpack_from('>BBHI', raw, stop+8)
    certs = pkcs7.load_der_pkcs7_certificates(raw[offset:-32])
    expected = sorted(c['sha256'] for c in baseline['cms_certificates'])
    assert sorted(SHA(c.public_bytes(Encoding.DER)) for c in certs) == expected, 'CMS chain changed'
    now = datetime.now(timezone.utc)
    for cert in certs:
        issuers = [c for c in certs if c.subject == cert.issuer]
        assert len(issuers) == 1, 'Missing or ambiguous issuer'
        cert.verify_directly_issued_by(issuers[0])
        assert cert.not_valid_before_utc <= now < cert.not_valid_after_utc, 'Expired certificate'
    return {'exact_same_certificates': True, 'issuer_signatures_valid': True, 'currently_valid': True,
            'certificate_sha256': expected, 'scope': 'No online revocation/device trust claim'}

def verify(app, hap, sdk=None):
    baseline = json.loads((ROOT/'qa/install34/evidence/package-comparison.json').read_text())['samples']['timerfix']
    profile = ROOT/'certs/elcton.p7b'
    assert SHA(profile.read_bytes()) == PROFILE_SHA, 'Wrong profile identity'
    cms = VERIFY(hap, profile)
    bundle, saved, raw = UNPACK(hap)
    original = app_files(app)
    assert set(saved) == set(original) == set(baseline['file_order']), 'Resource set changed'
    assert bundle == cms['bundle'] == baseline['bundle'] == 'watchapp.nexus.0zzip'
    version = json.loads((ROOT/'entry/src/main/config.json').read_text())['app']['version']
    assert version == {'code':1000117, 'name':'1.1.14'}, 'Wrong candidate version'
    expected = json.loads(original['config.json'])
    assert expected['app']['version'] == version
    expected['app']['bundleName'] = bundle
    config = json.loads(saved['config.json'])
    assert config == expected, 'Unexpected signer config mutation'
    base_config = json.loads(json.dumps(baseline['config']))
    base_config['app']['version'] = version
    assert config == base_config, 'Config change beyond version'
    prefix = 'assets/js/MainAbility/'
    manifest = json.loads(saved[prefix+'manifest.json'])
    assert manifest['pages'] == config['module']['js'][0]['pages'] == baseline['manifest']['pages']
    assert manifest['versionCode'] == version['code'] and manifest['versionName'] == version['name']
    js = {n:gzip.decompress(b) if b.startswith(b'\x1f\x8b') else b for n,b in saved.items() if n.endswith('.js')}
    assert all(b'PRIVATE KEY-----' not in b for b in js.values()), 'Private key marker in decoded JS'
    assert set(js) == {prefix+'app.js'} | {prefix+p+'.js' for p in manifest['pages']}, 'Actual JS/pages differ'
    rows=[]
    for name, data in saved.items():
        assert b'PRIVATE KEY-----' not in data, 'Private key marker in artifact: '+name
        assert not name.lower().endswith(('.p12','.pfx','.key','.pem')), 'Signing material in resources: '+name
        if name != 'config.json':
            assert data == original[name], 'Signed/APP payload mismatch: '+name
        rows.append({'path':name,'bytes':len(data),'sha256':SHA(data)})
    assert all(len(b)<49152 for b in js.values()), 'Existing 48KiB code gate exceeded'
    chain = chain_check(raw, baseline)
    with tempfile.TemporaryDirectory(prefix='install34-gate-') as temp:
        temp=Path(temp)
        inputs=[]
        for index,(name,data) in enumerate(js.items()):
            path=temp/('payload-%s.js'%index); path.write_bytes(data); inputs.append((name,path))
        ast=subprocess.run(['node',str(ROOT/'qa/install34/check_signed_ast.cjs'),*[str(p) for _,p in inputs]],capture_output=True,text=True,timeout=60)
        assert ast.returncode == 0, 'Signed AST rejected: '+ast.stdout+ast.stderr
        mutant=bytearray(raw); mutant[64]^=1
        negative=temp/'digest-negative.hap'
        with zipfile.ZipFile(negative,'w') as archive: archive.writestr('signed.bin',mutant)
        try: VERIFY(negative,profile)
        except ValueError as error:
            assert 'digest is not bound' in str(error), 'Unexpected negative failure'
        else: raise AssertionError('One-byte negative accepted')
        native=[]
        if sdk:
            assert SHA(sdk.read_bytes()) == SDK_SHA, 'Not the diagnosed SDK binary'
            for name,path in inputs:
                p=subprocess.run([str(sdk),'--parse-only',str(path)],capture_output=True,text=True,timeout=30)
                native.append({'path':name,'sha256':SHA(path.read_bytes()),'returncode':p.returncode,'stderr':p.stderr})
                assert p.returncode == 0, 'SDK parse rejected '+name+': '+p.stderr
    return {'passed':True,'hap_sha256':SHA(hap.read_bytes()),'app_sha256':SHA(app.read_bytes()),
            'hap_bytes':hap.stat().st_size,'bundle':bundle,'version':version,'profile_sha256':PROFILE_SHA,
            'cms':cms,'chain':chain,'one_byte_negative_rejected':True,'signed_ast_passed':True,
            'resource_count':len(saved),'resources':rows,'pages':manifest['pages'],
            'js':[{'path':n,'bytes':len(b),'sha256':SHA(b)} for n,b in js.items()],
            'native_parse':native,'native_sdk_sha256':SDK_SHA if sdk else None,
            'scope':'Static signing/bytes and SDK parse only; no device installation, UI or Wear Engine E2E claim'}

if __name__ == '__main__':
    app,hap,out=map(Path,sys.argv[1:4])
    sdk=Path(sys.argv[4]) if len(sys.argv)>4 else None
    result=verify(app,hap,sdk)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:v for k,v in result.items() if k!='resources'}))
