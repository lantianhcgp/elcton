from pathlib import Path
import base64, hashlib, json, re, struct, subprocess, zipfile
from cryptography import x509
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
OUT=Path(__file__).resolve().parent
hap=Path('/storage/emulated/0/haps/elcton-20261114-P2P准备回执-1.1.15-73c7823.hap')
raw=zipfile.ZipFile(hap).read('signed.bin')
size,kind=struct.unpack_from('>II',raw,len(raw)-12)
end=len(raw)-size
pt,tag,plen,pstart=struct.unpack_from('>BBHI',raw,end)
ct,ctag,clen,cstart=struct.unpack_from('>BBHI',raw,end+8)
assert kind==2 and pt==2 and pstart==end+16 and cstart==pstart+plen
profile=raw[pstart:cstart]
cms=raw[cstart:-32]
def oss(data,args):
 p=subprocess.run(['openssl']+args,input=data,capture_output=True)
 if p.returncode: raise RuntimeError(p.stderr.decode())
 return p.stdout
body=oss(profile,['cms','-verify','-binary','-inform','DER','-noverify','-purpose','any'])
doc=json.loads(body)
leaf=x509.load_pem_x509_certificate(doc['bundle-info']['development-certificate'].encode())
point=leaf.public_key().public_bytes(Encoding.X962,PublicFormat.UncompressedPoint)
identity=doc['bundle-info']['bundle-name']+'_'+base64.b64encode(point).decode()
wp=(OUT/'phone-0.2.9/WearProbe.kt').read_text()
match=re.search('watchFingerprint="([^"]+)"',wp)
assert match is not None
expected=match.group(1)
content=oss(cms,['cms','-verify','-binary','-inform','DER','-noverify','-purpose','any','-signer',str(OUT/'apk/hap-signer.pem')])
signer=x509.load_pem_x509_certificate((OUT/'apk/hap-signer.pem').read_bytes())
assert signer.public_bytes(Encoding.DER)==leaf.public_bytes(Encoding.DER)
slices=[hashlib.sha256(raw[i:min(i+4096,cstart)]).digest() for i in range(0,cstart,4096)]
digest=hashlib.sha256(b''.join(slices)).digest()
assert content[-32:]==digest
# Parse the unsigned Lite file table rather than confuse source bundleName with signed package identity.
pos=1
assert raw[0]==0xBE
n=struct.unpack_from('>I',raw,pos)[0];pos+=4
bundle=raw[pos:pos+n].decode();pos+=n
files={}
while pos<end:
 n=struct.unpack_from('>I',raw,pos)[0];pos+=4;fn=raw[pos:pos+n].decode();pos+=n
 n=struct.unpack_from('>I',raw,pos)[0];pos+=4;rel=raw[pos:pos+n].decode();pos+=n
 n=struct.unpack_from('>Q',raw,pos)[0];pos+=8;files[(rel+'/'+fn).lstrip('/')]=raw[pos:pos+n];pos+=n
assert pos==end
cfg=json.loads(files['config.json'])
wi=(OUT/'watch-1.1.15/wearIdentity.js').read_text()
phone=(OUT/'apk/previous-actual-receipt.json')
receipt=json.loads(phone.read_text())['rows'][0]
pkg=receipt['package'];fp=receipt['signer_sha256']
page=files['assets/js/MainAbility/pages/phone-sync/phone-sync.js']
report={'hap_path':str(hap),'sha256':hashlib.sha256(hap.read_bytes()).hexdigest(),'signed_bundle':bundle,'config_bundle':cfg['app']['bundleName'],'config_version':cfg['app']['version'],'profile_bundle':doc['bundle-info']['bundle-name'],'profile_sha256':hashlib.sha256(profile).hexdigest(),'leaf_certificate_sha256':hashlib.sha256(leaf.public_bytes(Encoding.DER)).hexdigest(),'derived_watch_identity':identity,'phone_exact_apk_watch_identity':expected,'watch_identity_matches':identity==expected,'point_bytes':len(point),'phone_apk_package':pkg,'phone_apk_signer_sha256':fp,'phone_identity_in_watch_source':pkg in wi and fp in wi,'phone_identity_in_actual_watch_compiled_page':pkg.encode() in page and fp.encode() in page,'cms_valid':True,'cms_signer_equals_profile_leaf':True,'payload_digest_bound':True,'scope':'public artifact identity only; NOT firmware acceptance or installed package evidence'}
assert report['watch_identity_matches'] and report['phone_identity_in_actual_watch_compiled_page']
(OUT/'apk/public-dual-identity-actual.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
