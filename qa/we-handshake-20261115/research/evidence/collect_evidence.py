"""Read-only source/history/SDK/APK audit; writes only inside this research evidence directory."""
from pathlib import Path
import datetime, hashlib, json, os, re, struct, subprocess, zipfile
BASE = Path('/data/data/com.termux/files/home')
OUT = Path(__file__).resolve().parent
WATCH = BASE/'we-handshake-repair-20261115-watch'
FULL = BASE/'elcton-wear-realdevice'
PHONE = BASE/'elcton-phone-release-029-20261114'
WREV = '83d58a8f931848bdf65bb923e5579ff7285a0714'
PREV = 'bb26c64b67e1cfa7903cd709c2aac482f6490e6b'
PBUILD = '84a6c406099348f75b436a8e9467c34487766859'
SNAP = Path('/storage/emulated/0/Documents/elcton-WearEngine-真机联调-20261113-123000/01-官方正文与SDK快照')
SDK = BASE/'work/elcton-hms-investigation-20261114/.git/hms-analysis/sdk'
REPOS = ['we-handshake-repair-20261115-watch','we-ready-receipt-20261114-watch','elcton-wear-realdevice','elcton-wear-sync','elcton-wear-install34-20261113','work/elcton-hms-investigation-20261114','elcton-phone-release-029-20261114']
INITIAL = {
 'we-handshake-repair-20261115-watch': {'head':WREV,'status':''},
 'we-ready-receipt-20261114-watch': {'head':WREV,'status':''},
 'elcton-wear-realdevice': {'head':'9517f345e8d0e0995708b0a5d0b37b4cae8689ac','status':'?? tools/sign/node_modules\n'},
 'elcton-wear-sync': {'head':'2a8183a537db333df1d3eeb350015dbd99ac71d2','status':'?? .ai-memory/\n?? qa/late_timeout_probe.mjs\n'},
 'elcton-wear-install34-20261113': {'head':'0be04ed667392401c6024d892feb6983928c903c','status':'?? qa/install34/.artifact-cache/\n?? tools/sign/node_modules\n'},
 'work/elcton-hms-investigation-20261114': {'head':'0e72d9a4d1bd49f01a221e62c679eb2059a52bdc','status':''},
 'elcton-phone-release-029-20261114': {'head':PREV,'tracked_change':' M qa/release-029/evidence/resume-1720/CONTINUATION-R10.md','tracked_diff_stat':'6 insertions(+); initial untracked release evidence exists (see raw first tool result)'}
}
def put(rel, content):
 p = OUT/rel
 p.parent.mkdir(parents=True, exist_ok=True)
 p.write_bytes(content if isinstance(content, bytes) else content.encode('utf-8'))
 return str(p)
def jput(rel, obj): return put(rel, json.dumps(obj, ensure_ascii=False, indent=2)+'\n')
def run(args):
 p = subprocess.run(args, env=dict(os.environ,GIT_OPTIONAL_LOCKS='0'),text=True,capture_output=True)
 return {'command':args,'exit_code':p.returncode,'stdout':p.stdout,'stderr':p.stderr}
def git(repo,*args): return run(['git','--no-optional-locks','-C',str(repo),*args])
def source(repo,rev,path,rel):
 r=git(repo,'show',rev+':'+path)
 if r['exit_code']: raise RuntimeError(r)
 put(rel,r['stdout'])
 return {'repo':str(repo),'rev':rev,'path':path,'evidence':rel,'sha256':hashlib.sha256(r['stdout'].encode()).hexdigest()}

def collect():
 jput('workspace-initial.json',{'observed_at':'2026-11-14T16:05:21Z','source':'first actual terminal tool capture in this task, before all writes','repos':INITIAL})
 states={n:{'head':git(BASE/n,'rev-parse','HEAD'),'status':git(BASE/n,'status','--porcelain=v1'),'diff':git(BASE/n,'diff'),'cached':git(BASE/n,'diff','--cached'),'shallow':git(BASE/n,'rev-parse','--is-shallow-repository')} for n in REPOS}
 jput('workspace-capture.json',{'utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'states':states})
 index=[]
 old='e1f60dda9d1664c2b2932334d6a32db219f6543f'
 specs=[('f8a8d73248ab41ac700aa58e96e000c143c8640e','docs/lan-sync-probe.md','history/1009-lan-sync-probe.md'),('659128e587c7832ae105c4566b87b7cd7f1ef7bc','docs/pickup-code.md','history/1009-pickup-code.md'),('697ee9dfe921840fbcfe3ee13d32b7c76685324b','docs/pickup-code.md','history/1010-pickup-code.md'),(old,'entry/src/main/js/MainAbility/pages/sync/sync.js','history/1011-0012-sync.js'),(old,'docs/sync-endpoint.md','history/1011-cloud-sync-endpoint.md'),(old,'entry/src/main/config.json','history/1011-config.json'),('7984758ff19455bb8424d64e8ff2ec8fd82d050c','docs/pickup-code.md','history/1011-0013-pickup-code.md')]
 for rev,path,rel in specs: index.append(source(FULL,rev,path,rel))
 jput('history/commit-history.json',git(FULL,'log','--all','--since=2026-10-08','--until=2026-10-11T01:00:00+08:00','--date=iso-strict','--format=%H %ad %s'))
 jput('history/first-we-history.json',git(FULL,'log','--all','--reverse','--date=iso-strict','--format=%H %ad %s','--','entry/src/main/js/MainAbility/common/wearChannel.js','entry/src/main/js/MainAbility/pages/phone-sync/phone-sync.js','docs/wearengine-probe.md'))
 jput('history/old-active-we-absence.json',git(FULL,'grep','-n','-E','wearengine|FeatureAbility|subscribeMsg|setFingerprint|HELLO|READY',old,'--','entry/src/main/js/MainAbility'))
 for repo,rev,paths,subdir in [
  (WATCH,WREV,['entry/src/main/js/MainAbility/common/wearService.js','entry/src/main/js/MainAbility/common/wearChannel.js','entry/src/main/js/MainAbility/common/wearIdentity.js','entry/src/main/js/MainAbility/pages/phone-sync/phone-sync.js','entry/src/main/config.json','entry/src/main/js/MainAbility/app.js','tools/sign/sign-app-to-hap.js'], 'watch-1.1.15'),
  (PHONE,PREV,['app/src/main/java/com/hcbiu/elcton/WearProbe.kt','app/src/main/java/com/hcbiu/elcton/SyncEngine.kt','app/src/main/java/com/hcbiu/elcton/PhoneRuntime.kt','app/src/main/java/com/hcbiu/elcton/PhoneActions.kt','app/src/main/java/com/hcbiu/elcton/DevicePolicy.kt','app/src/main/java/com/hcbiu/elcton/PacketIngress.kt','app/src/main/java/com/hcbiu/elcton/Wire.kt','app/build.gradle.kts'],'phone-0.2.9')]:
  for path in paths: index.append(source(repo,rev,path,subdir+'/'+Path(path).name))
 jput('phone-0.2.9/build-to-head.diff.json',git(PHONE,'diff',PBUILD,PREV,'--','app/src/main/java/com/hcbiu/elcton/WearProbe.kt','app/src/main/java/com/hcbiu/elcton/SyncEngine.kt','app/src/main/java/com/hcbiu/elcton/PhoneRuntime.kt','app/src/main/java/com/hcbiu/elcton/PhoneActions.kt','app/build.gradle.kts'))
 for path in ['entry/src/main/js/MainAbility/common/wearChannel.js','entry/src/main/js/MainAbility/pages/phone-sync/phone-sync.js']:
  index.append(source(FULL,'0be04ed667392401c6024d892feb6983928c903c',path,'watch-pre-1.1.15/'+Path(path).name))
 jput('history/pre-we-to-1.1.15.diff.json',git(WATCH,'diff','0be04ed667392401c6024d892feb6983928c903c',WREV,'--','entry/src/main/js/MainAbility/common/wearChannel.js','entry/src/main/js/MainAbility/common/wearService.js','entry/src/main/js/MainAbility/pages/phone-sync/phone-sync.js'))
 sdkrows=[]
 aar=SNAP/'android-aar.zip'
 with zipfile.ZipFile(aar) as z:
  data=z.read('classes.jar'); manifest=z.read('AndroidManifest.xml')
  assert data==(SDK/'classes.jar').read_bytes()
  put('sdk/classes.jar',data); put('sdk/AndroidManifest.xml',manifest)
  sdkrows.append({'path':str(aar),'bytes':aar.stat().st_size,'sha256':hashlib.sha256(aar.read_bytes()).hexdigest(),'classes_jar_sha256':hashlib.sha256(data).hexdigest(),'existing_extracted_jar_byte_equal':True})
 for cls in ['Device','DeviceJsonUtil','common.a','P2pClient']:
  name={'Device':'com.huawei.wearengine.device.Device','DeviceJsonUtil':'com.huawei.wearengine.utils.json.DeviceJsonUtil','common.a':'com.huawei.wearengine.common.a','P2pClient':'com.huawei.wearengine.p2p.P2pClient'}[cls]
  r=run(['javap','-p','-c','-constants','-classpath',str(OUT/'sdk/classes.jar'),name]); jput('sdk/'+cls+'.javap.json',r)
 for rel in ['com/huawei/wearengine/device/Device.java','com/huawei/wearengine/utils/json/DeviceJsonUtil.java','com/huawei/wearengine/common/a.java','com/huawei/wearengine/p2p/P2pClient.java']:
  p=SDK/'decompiled/sources'/rel; put('sdk/decompiled-excerpts/'+p.name,p.read_bytes())
 js=(SNAP/'wearengine-official.js').read_bytes(); put('sdk/wearengine-official.js',js)
 with zipfile.ZipFile(OUT/'sdk/classes.jar') as z: names=z.namelist()
 jput('sdk/verification.json',{'android_aar':sdkrows,'js_sdk_sha256':hashlib.sha256(js).hexdigest(),'Capability_symbols':[n for n in names if 'Capability' in n],'hasAvailableP2pService_in_official_js':b'hasAvailableP2pService' in js,'hasAvailableP2pService_in_aar_class_bytes':any(b'hasAvailableP2pService' in zipfile.ZipFile(OUT/'sdk/classes.jar').read(n) for n in names if n.endswith('.class'))})
 # Original official document response already captured by previous audit; exact bytes copied, not session evidence.
 raw=(SNAP/'phone-devices.json').read_bytes(); put('official/device-connection-management.raw.json',raw)
 obj=json.loads(raw); html=obj['value']['content']['content']
 from lxml import html as lh
 put('official/device-connection-management.txt',lh.fromstring(html).text_content())
 for n in ['phone-identity.json','phone-p2p.json','js-p2p-guide.json','js-p2p-official.json','lite-sdk-official.json','artifact-verification.json']:
  put('official/'+n,(SNAP/n).read_bytes())
 # DEX class-index and identity constants, from exact existing release artifact; never install or invoke app.
 apk=PHONE/'qa/release-029/evidence/resume-1720/resume-fourth/r11/exact-cloud-pipeline/build-artifact/artifact/dist/elcton-phone-probe.apk'
 packet=[]; targets={'Lcom/hcbiu/elcton/WearProbe;','Lcom/hcbiu/elcton/SyncEngine;','Lcom/huawei/wearengine/device/Device;','Lcom/huawei/wearengine/p2p/P2pClient;'}
 wp=git(PHONE,'show',PREV+':app/src/main/java/com/hcbiu/elcton/WearProbe.kt')['stdout']
 match = re.search(r'watchFingerprint="([^"]+)"', wp)
 if match is None: raise RuntimeError('Missing exact peer fingerprint in frozen source')
 peer = match.group(1)
 with zipfile.ZipFile(apk) as z:
  assert z.testzip() is None
  for n in z.namelist():
   if not n.endswith('.dex'): continue
   d=z.read(n); sc,so=struct.unpack_from('<II',d,56); strings=[]
   for i in range(sc):
    pos=struct.unpack_from('<I',d,so+i*4)[0]
    while d[pos]&128: pos+=1
    pos+=1; strings.append(d[pos:d.index(0,pos)].decode('utf-8',errors='replace'))
   tc,to=struct.unpack_from('<II',d,64); types=[strings[struct.unpack_from('<I',d,to+i*4)[0]] for i in range(tc)]
   cc,co=struct.unpack_from('<II',d,96); defined={types[struct.unpack_from('<I',d,co+i*32)[0]] for i in range(cc)}
   found=targets.intersection(defined)
   if found:
    put('apk/target-dex/'+n,d)
    packet.append({'dex':n,'bytes':len(d),'sha256':hashlib.sha256(d).hexdigest(),'targets':sorted(found),'source_peer_fingerprint_in_strings':peer in strings,'source_peer_package_in_strings':'watchapp.nexus.0zzip' in strings,'relevant_strings':[s for s in strings if s in [peer,'watchapp.nexus.0zzip','setPeerPkgName','setPeerFingerPrint','registerReceiver','isAppInstalled','p2p.send','getP2pCapability']]})
 jput('apk/index-and-identity.json',{'apk_path':str(apk),'bytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'crc_ok':True,'source_commit':PBUILD,'repo_head':PREV,'peer_identity':peer,'dex_rows':packet})
 receipt=apk.parents[3]/'build-verification/receipt.json'
 put('apk/previous-actual-receipt.json',receipt.read_bytes())
 for name in ['elcton-phone-probe.apk.badging.stdout.bin','elcton-phone-probe.apk.signer.stdout.bin']:
  p=receipt.parent/name
  if p.exists(): put('apk/'+name+'.txt',p.read_bytes())
 jput('source-index.json',index)
 print(json.dumps({'evidence_dir':str(OUT),'source_snapshots':len(index),'sdk_default':'DeviceJsonUtil passes fallback 2 (UNKNOWN)','apk_sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'target_dex':packet},ensure_ascii=False,indent=2))

if __name__=='__main__': collect()
