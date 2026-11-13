#!/usr/bin/env python3
"""Read-only package comparison. No key/device/browser access; no raw profile output."""
import gzip
import hashlib
import json
from pathlib import Path
import runpy
import struct
import subprocess
import sys
from cryptography.hazmat.primitives.serialization import pkcs7, Encoding

sys.dont_write_bytecode = True
REPO = Path(__file__).resolve().parents[2]
DELIVERY = Path('/storage/emulated/0/Documents/elcton-WearEngine-真机联调-20261113-123000')
OUT = Path(__file__).parent / 'evidence'
OUT.mkdir(exist_ok=True)
parser = runpy.run_path(str(REPO / 'qa/verify_final_artifacts.py'))['unpack_signed']
verify = runpy.run_path(str(REPO / 'tools/sign/verify_sign.py'))['verify']
sha = lambda b: hashlib.sha256(b).hexdigest()

def certs(blob):
    values = pkcs7.load_der_pkcs7_certificates(blob)
    return [{'subject': c.subject.rfc4514_string(), 'issuer': c.issuer.rfc4514_string(),
             'sha256': sha(c.public_bytes(Encoding.DER))} for c in values]

def inspect(label, path):
    bundle, records, raw = parser(path)
    files = {n: gzip.decompress(b) if b.startswith(b'\x1f\x8b') else b for n, b in records.items()}
    stop = len(raw) - struct.unpack_from('>I', raw, len(raw)-12)[0]
    _, _, plen, pstart = struct.unpack_from('>BBHI', raw, stop)
    _, _, _, cstart = struct.unpack_from('>BBHI', raw, stop+8)
    assert cstart == pstart + plen
    profile, cms = raw[pstart:cstart], raw[cstart:-32]
    proc = subprocess.run(['openssl','cms','-verify','-binary','-inform','DER','-noverify','-purpose','any'], input=profile, capture_output=True, timeout=30)
    assert proc.returncode == 0, proc.stderr.decode()
    doc = json.loads(proc.stdout)
    config = json.loads(files['config.json'])
    manifest = json.loads(files['assets/js/MainAbility/manifest.json'])
    cache = Path(subprocess.check_output(['git','rev-parse','--git-dir'], cwd=REPO, text=True).strip()) / 'install34-extracted' / label
    cache.mkdir(parents=True, exist_ok=True)
    for name, blob in files.items():
        if name.endswith('.js'):
            target = cache / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(blob)
    js = [{'path': n, 'bytes': len(b), 'sha256': sha(b)} for n,b in sorted(files.items()) if n.endswith('.js')]
    result = {
        'path': str(path), 'sha256': sha(path.read_bytes()), 'signed_bin_sha256': sha(raw),
        'signed_bin_bytes': len(raw), 'magic': raw[:1].hex(), 'bundle': bundle,
        'config': config, 'manifest': manifest, 'pack_info': json.loads(files['pack.info']),
        'profile_sha256': sha(profile), 'profile_bundle': doc['bundle-info']['bundle-name'],
        'profile_type': doc['type'], 'profile_validity': doc['validity'],
        'profile_capabilities': doc.get('app-services-capabilities'),
        'profile_permissions': doc.get('permissions'),
        'bound_device_count': len(doc.get('debug-info',{}).get('device-ids',[])),
        'profile_certificates': certs(profile), 'cms_certificates': certs(cms),
        'cms_verification': verify(path, REPO / 'certs/elcton.p7b'),
        'file_count': len(files), 'file_order': list(files),
        'gzip_count': sum(b.startswith(b'\x1f\x8b') for b in records.values()),
        'bc_files': [n for n in files if n.endswith('.bc')],
        'map_files': [n for n in files if n.endswith('.js.map')],
        'i18n_files': [n for n in files if '/i18n/' in n],
        'js_total_bytes': sum(r['bytes'] for r in js), 'js': js,
        'files': [{'path':n,'bytes':len(b),'sha256':sha(b)} for n,b in sorted(files.items())],
        'extracted_js_cache': str(cache)
    }
    assert bundle == config['app']['bundleName'] == result['profile_bundle']
    assert config['module']['js'][0]['pages'] == manifest['pages']
    return result, files

def differences(a,b, prefix=''):
    if isinstance(a,dict) and isinstance(b,dict):
        rows=[]
        for k in sorted(set(a)|set(b)):
            rows += differences(a.get(k),b.get(k),prefix+'.'+k)
        return rows
    return [] if a==b else [{'field':prefix.lstrip('.'),'probe':a,'timerfix':b}]

samples = {'probe':'elcton-wearengine-probe.hap','timerfix':'elcton-wearengine-timerfix-1.1.13-9517f34.hap'}
results, payloads = {}, {}
for label, filename in samples.items():
    results[label], payloads[label] = inspect(label, DELIVERY / 'watch' / filename)
a,b = payloads['probe'],payloads['timerfix']
assert set(a)==set(b)
comparison = {'same_file_set':True,'same_file_order':results['probe']['file_order']==results['timerfix']['file_order'],
              'same_profile':results['probe']['profile_sha256']==results['timerfix']['profile_sha256'],
              'same_cms_certificates':results['probe']['cms_certificates']==results['timerfix']['cms_certificates'],
              'config_differences':differences(results['probe']['config'],results['timerfix']['config']),
              'manifest_differences':differences(results['probe']['manifest'],results['timerfix']['manifest']),
              'changed_files':[{'path':n,'probe_bytes':len(a[n]),'timerfix_bytes':len(b[n])} for n in sorted(a) if a[n]!=b[n]],
              'unchanged_files':[n for n in sorted(a) if a[n]==b[n]]}
result={'samples':results,'comparison':comparison,'scope':'Static comparison; probe installation success is unconfirmed, CMS noverify is not device trust.'}
(OUT/'package-comparison.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'comparison':comparison,'envelopes':{k:{f:v[f] for f in ['magic','bundle','file_count','js_total_bytes','gzip_count','bc_files','cms_certificates','extracted_js_cache']} for k,v in results.items()}},ensure_ascii=False))
