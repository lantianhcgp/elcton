import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const script=path.join(root,'scripts/verify_we_logger_bundle.py');
const A='assets/js/MainAbility/';
const version={code:1000119,name:'1.1.16'};
function sample(files){
  const base=path.join(root,'qa/we-handshake-20261115/logger/test-runs');
  fs.mkdirSync(base,{recursive:true});const dir=fs.mkdtempSync(path.join(base,'bundle-gate-'));
  const app=path.join(dir,'fixture.app');
  const cmd='import sys,json,zipfile,io; v=json.load(sys.stdin); b=io.BytesIO(); h=zipfile.ZipFile(b,"w"); [h.writestr(k,x.encode()) for k,x in v.items()]; h.close(); o=zipfile.ZipFile(sys.argv[1],"w"); o.writestr("entry.hap",b.getvalue()); o.close()';
  const r=spawnSync('python',['-c',cmd,app],{input:JSON.stringify(files),encoding:'utf8'});assert.equal(r.status,0,r.stderr);
  return app;
}
function files(){
  const prefix=fs.readFileSync(path.join(root,'entry/src/main/js/MainAbility/common/logsink.js'),'utf8').replace('export default L;','');
  const config={endpoint:'https://example.invalid/ELCTON_WE_LOG_ENDPOINT_PLACEHOLDER_20261115',key:'ELCTON_WE_WRITE_KEY_PLACEHOLDER_20261115',app:'elcton',ver:'1.1.16'};
  return {'config.json':JSON.stringify({app:{version},module:{js:[{pages:['pages/phone-sync/phone-sync']}]}}),
    [A+'manifest.json']:JSON.stringify({pages:['pages/phone-sync/phone-sync'],versionCode:version.code,versionName:version.name}),
    [A+'app.js']:prefix+';var cfg='+JSON.stringify(config)+';L.init(cfg);L.page("MainAbility");var tags="SDK_CALL VER_OK PKG_OK CERT_OK REG_OK SEND_FAIL READY_FAIL";',
    [A+'pages/phone-sync/phone-sync.js']:'var call=require("@system.brightness");call.setKeepScreenOn({keepScreenOn:true});var tag="HELLO_RECV READY_PREPARED KEEP_ON";'};
}
function check(v){const p=sample(v);return spawnSync('python',[script,p],{cwd:root,encoding:'utf8'});}

test('actual package logger gate validates public placeholders, every app/page budget, real page set, full logger stages and runtime calls',()=>{
  const r=check(files());assert.equal(r.status,0,r.stderr);const report=JSON.parse(r.stdout);assert.equal(report.passed,true);assert.equal(report.bytecode_absent,true);assert.equal(report.public_only,true);assert.equal(report.js.length,2);
});
for(const [name,change] of [
  ['bytecode',v=>v[A+'pages/phone-sync/phone-sync.bc']='JRRYfixture'],
  ['extra JS not in manifest',v=>v[A+'pages/other/other.js']='var x=1;'],
  ['mismatched manifest version',v=>v[A+'manifest.json']=JSON.stringify({pages:['pages/phone-sync/phone-sync'],versionCode:0,versionName:'1.1.16'})],
  ['SDK emitted external dependency',v=>v[A+'app.js']+=';require("@babel/runtime/helpers/objectSpread2");'],
  ['SDK emitted unbound require',v=>v[A+'app.js']+=';require("./common/logsink.js");'],
  ['actual app exceeds old 48KiB gate',v=>v[A+'app.js']+=' '.repeat(49152)],
  ['logger lost X-Log-Key marker',v=>v[A+'app.js']=v[A+'app.js'].replace('X-Log-Key','Lost-Key')],
  ['logger init not actually emitted',v=>v[A+'app.js']=v[A+'app.js'].replace('L.init(cfg)','void cfg')],
  ['SDK omitted HELLO diagnostics',v=>v[A+'pages/phone-sync/phone-sync.js']='var call=require("@system.brightness");'],
  ['unknown private runtime key in CI',v=>v[A+'app.js']=v[A+'app.js'].replace('ELCTON_WE_WRITE_KEY_PLACEHOLDER_20261115','PRIVATE_KEY_NOT_AUTHORIZED_IN_PUBLIC_CI')]
]) test('package gate rejects '+name,()=>{const v=files();change(v);const r=check(v);assert.notEqual(r.status,0);assert.ok((r.stdout+r.stderr).includes('FAIL:'),'not a missing module/syntax failure');assert.ok(!(r.stdout+r.stderr).includes('PRIVATE_KEY_NOT_AUTHORIZED_IN_PUBLIC_CI'));});
