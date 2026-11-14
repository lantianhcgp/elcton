import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {loader} from './loadSource.mjs';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ability=path.join(root,'entry/src/main/js/MainAbility');
function appHarness({log, config={}, sink, wearService={}}={}) {
  const events=[];
  const L=log || {init:c=>events.push(['init',c]), page:p=>events.push(['page',p]), stop:()=>events.push(['stop'])};
  const original={info:msg=>{events.push(['console',msg]); if(sink)sink(msg);}};
  const source=fs.readFileSync(path.join(ability,'app.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace('export default','var app =');
  const context={L,logConfig:config,wearService,console:original};
  vm.runInNewContext(source+'\nthis.result=app;',context);
  return {app:context.result,events,L,original};
}
test('app owns logger init/page before its original console and cleans up on destroy',()=>{
  const config={key:'fixture-write-only'};const service={marker:'original-service'};
  const x=appHarness({config,wearService:service});x.app.onCreate();
  assert.deepEqual(x.events,[['init',config],['page','MainAbility'],['console','Application onCreate']]);
  assert.equal(x.app._elctonWearChannel,service);
  x.app.onDestroy();
  assert.deepEqual(x.events.slice(-2),[['console','Application onDestroy'],['stop']]);
});
test('onDestroy stops logger in finally and preserves the original exception',()=>{
  const error=new Error('fixture-original-console');
  const x=appHarness({sink:()=>{throw error;}});
  assert.throws(()=>x.app.onDestroy(),e=>e===error);
  assert.deepEqual(x.events,[['console','Application onDestroy'],['stop']]);
});
test('app stage helper emits fixed WE tag and only bounded own numeric/boolean metadata',()=>{
  const calls=[];const L={i:(...a)=>calls.push(a)};const x=appHarness({log:L});
  assert.equal(typeof x.app._elctonLog,'function','app-level logger channel is missing');
  const meta={ok:true,code:206,bytes:64,payload:'SENSITIVE',identity:'PRIVATE',error:'NATIVE_DETAIL',key:'WRITE_KEY'};
  Object.defineProperty(meta,'count',{get(){throw new Error('unsafe getter must not run');},enumerable:true});
  assert.equal(x.app._elctonLog('SDK_UNVERSIONED',meta),true);
  assert.equal(calls[0][0],'WE/SDK_UNVERSIONED');
  assert.equal(calls[0][1],'ok=true code=206 bytes=64');
  assert.equal(x.app._elctonLog('BAD payload',meta),false);
  assert.equal(x.app._elctonLog('X'.repeat(30),meta),false);
  assert.equal(calls.length,1);
  x.app._elctonLog('RX_HELLO','PRIVATE_PAYLOAD_012345');
  assert.equal(calls[1][1],'');
  assert.ok(calls.every(c=>c[0].length<=32 && c[1].length<=160));
});
test('app logger status is a detached diagnostic snapshot and both helpers tolerate logger faults',()=>{
  const status={pending:2,sent:1,dropped:0,failed:0,busy:1,seq:3,key:'PRIVATE'};
  const x=appHarness({log:{i(){throw new Error('native private detail');},status(){return status;}}});
  assert.equal(typeof x.app._elctonLogStatus,'function','app diagnostic method is missing');
  const actual=x.app._elctonLogStatus();
  assert.deepEqual(JSON.parse(JSON.stringify(actual)),{pending:2,sent:1,dropped:0,failed:0,busy:1,seq:3});
  actual.pending=90;assert.equal(status.pending,2);
  assert.equal(x.app._elctonLog('SEND_FAIL',{code:206}),false);
  const broken=appHarness({log:{status(){throw new Error('private error');}}});
  assert.equal(broken.app._elctonLogStatus(),null);
});
const sha=b=>createHash('sha256').update(b).digest('hex');
const canonicalSha='6810b5f9ff34fe4dd6cf4655f75a89172c248dd01bb40ade94937e567cefbe77';
const upstream=fs.existsSync(path.join(root,'vendor/we-logger/watch/logsink.js'))?path.join(root,'vendor/we-logger/watch/logsink.js'):path.join(process.env.HOME,'lite-watch-logger/watch/logsink.js');
const generated=path.join(ability,'common/logsink.js');
const fixtureBase=path.join(root,'qa/we-handshake-20261115/logger/test-runs');
function fixture() {fs.mkdirSync(fixtureBase,{recursive:true});return fs.mkdtempSync(path.join(fixtureBase,'run-'));}
function python(script,...args) {return spawnSync('python',[path.join(root,'scripts',script),...args],{encoding:'utf8',cwd:root});}
function projectFixture() {
  const project=fixture();const dst=path.join(project,'entry/src/main/js/MainAbility');
  fs.mkdirSync(dst,{recursive:true});fs.copyFileSync(path.join(ability,'app.js'),path.join(dst,'app.js'));
  fs.copyFileSync(path.join(root,'entry/src/main/config.json'),path.join(project,'entry/src/main/config.json'));
  return {project,dst};
}
function configAt(dst) {return vm.runInNewContext(fs.readFileSync(path.join(dst,'common/log-config.js'),'utf8').replace('export default','var result=')+';result;');}
function loggerHarness(file=fs.existsSync(generated)?generated:upstream) {
  const timers=new Map(),requests=[],forward=[],cleared=[],selfClears=[];let next=0,active=null;
  const original={};for(const method of ['debug','log','info','warn','error'])original[method]=(...args)=>forward.push([method,...args]);
  const console={...original};
  const sandbox={console,require:name=>{assert.equal(name,'@system.fetch');return {fetch:p=>{requests.push(p);if(h.onFetch)h.onFetch(p);}};},
    setTimeout:(fn,ms)=>{const id=next++;timers.set(id,{fn,ms});return id;},
    clearTimeout:id=>{cleared.push(id);if(id===active){selfClears.push(id);throw new Error('ACE executing-Arguments UAF fixture');}timers.delete(id);}};
  vm.runInNewContext(fs.readFileSync(file,'utf8').replace('export default L;','this.logger=L;'),sandbox);
  const h={L:sandbox.logger,console,original,timers,requests,forward,cleared,selfClears,
    schedule:sandbox.setTimeout,
    fire(id){assert.ok(timers.has(id),'timer must exist');const timer=timers.get(id);active=id;try{timer.fn();}finally{active=null;timers.delete(id);}},
    fireMs(ms){const entry=[...timers].find(([,t])=>t.ms===ms);assert.ok(entry,'scheduled '+ms+'ms timer must exist');this.fire(entry[0]);}};
  return h;
}
const enabled={endpoint:'https://fixture.invalid/ingest',key:'fixture-write-key-0123456789',app:'elcton',ver:'1.1.15'};
test('logger owns a valid timer ID zero without double scheduling or cancelling unrelated timers',()=>{
  const x=loggerHarness();const unrelated=x.schedule(()=>{},9999);assert.equal(unrelated,0);
  x.L.init(enabled);assert.ok(x.timers.has(unrelated),'init must not clear unrelated native ID zero');
  x.L.page('MainAbility');x.L.i('WE/RX_HELLO','');
  assert.equal([...x.timers].filter(([,t])=>t.ms===5000).length,1);
  x.L.stop();assert.deepEqual([...x.timers.keys()],[unrelated]);
  const zero=loggerHarness();zero.L.init(enabled);zero.L.page('MainAbility');zero.L.i('WE/OPEN','');
  assert.equal(zero.timers.size,1,'ID zero must be treated as an owned active timer');zero.L.stop();assert.equal(zero.timers.size,0);
});
test('synchronous fetch ACK never clears the executing pump native Arguments',()=>{
  const x=loggerHarness();x.onFetch=p=>p.success({code:200,data:'{"ok":1}'});
  x.L.init(enabled);x.L.page('MainAbility');x.fireMs(5000);
  assert.deepEqual(x.selfClears,[]);assert.equal(x.L.status().sent,1);assert.equal(x.L.status().pending,0);
  assert.equal(x.L.status().busy,0);assert.ok([...x.timers.values()].some(t=>t.ms===50));
  x.L.stop();assert.equal(x.timers.size,0);
});
test('hung fetch watchdog never clears itself; late ACK cannot acknowledge a retry batch',()=>{
  const x=loggerHarness();x.L.init(enabled);x.L.page('MainAbility');x.fireMs(5000);
  const first=x.requests[0];x.fireMs(8000);
  assert.deepEqual(x.selfClears,[]);assert.equal(x.L.status().failed,1);assert.equal(x.L.status().busy,0);
  x.fireMs(5000);const retry=x.requests[1];const before=JSON.stringify(x.L.status());
  first.success({code:200,data:{ok:true}});assert.equal(JSON.stringify(x.L.status()),before);
  retry.success({code:200,data:{ok:true}});assert.equal(x.L.status().sent,1);assert.equal(x.L.status().pending,0);
  x.L.stop();const stopped=JSON.stringify(x.L.status());retry.success({code:200,data:{ok:true}});
  assert.equal(JSON.stringify(x.L.status()),stopped);assert.equal(x.timers.size,0);
});
test('prepare creates disabled/public-only configs from actual version, pins vendor, and is idempotent',()=>{
  const p=projectFixture();let r=python('prepare_we_logger.py',p.project,'--mode','disabled');
  assert.equal(r.status,0,'prepare must supply real generated logger/config: '+r.stderr);
  const cfg=configAt(p.dst);assert.deepEqual(Object.keys(cfg).sort(),['app','endpoint','key','ver']);
  assert.equal(cfg.app,'elcton');assert.equal(cfg.key,'');
  assert.equal(cfg.ver,JSON.parse(fs.readFileSync(path.join(p.project,'entry/src/main/config.json'))).app.version.name);
  const sink=fs.readFileSync(path.join(p.dst,'common/logsink.js'));assert.equal(sink.length,3018);
  const vendor=fs.readFileSync(path.join(root,'vendor/we-logger/watch/logsink.js'));
  assert.equal(vendor.length,2921);assert.equal(sha(vendor),canonicalSha);assert.equal(sha(sink),sha(fs.readFileSync(generated)));
  const before=fs.statSync(path.join(p.dst,'common/log-config.js')).mtimeMs;
  r=python('prepare_we_logger.py',p.project,'--mode','disabled');assert.equal(r.status,0);
  assert.equal(fs.statSync(path.join(p.dst,'common/log-config.js')).mtimeMs,before);
  const pub=projectFixture();r=python('prepare_we_logger.py',pub.project,'--mode','public-build');assert.equal(r.status,0);
  const c=configAt(pub.dst);assert.equal(c.key,'ELCTON_WE_WRITE_KEY_PLACEHOLDER_20261115');
  assert.equal(c.endpoint,'https://example.invalid/ELCTON_WE_LOG_ENDPOINT_PLACEHOLDER_20261115');
  const x=loggerHarness(path.join(pub.dst,'common/logsink.js'));x.L.init(c);x.L.page('MainAbility');
  assert.equal(x.L.status().seq,1);assert.equal(x.L.status().pending,1);assert.equal(x.timers.size,1);x.L.stop();
});
test('prepare rejects different existing config before changing logger or any other source',()=>{
  const p=projectFixture();const common=path.join(p.dst,'common');fs.mkdirSync(common);
  const original='export default {endpoint:"https://different.invalid",key:"fixture-private"};\n';
  fs.writeFileSync(path.join(common,'log-config.js'),original);
  const r=python('prepare_we_logger.py',p.project,'--mode','public-build');
  assert.notEqual(r.status,0);assert.equal(fs.readFileSync(path.join(common,'log-config.js'),'utf8'),original);
  assert.equal(fs.existsSync(path.join(common,'logsink.js')),false);assert.ok(!(r.stdout+r.stderr).includes('fixture-private'));
  assert.ok((r.stdout+r.stderr).includes('configuration differs'),'failure must be deliberate config protection, not a missing script');
});
test('strict timer adapter rejects canonical shape drift without modifying pinned input',()=>{
  const p=fixture();const src=path.join(p,'drift.js');const before=fs.readFileSync(upstream);
  fs.writeFileSync(src,Buffer.concat([before,Buffer.from('clearTimeout(h)')]));
  const r=spawnSync('python',['-B','-c','import sys; from pathlib import Path; sys.path.insert(0,"scripts"); from we_logger_timer_compat import adapt; adapt(Path(sys.argv[1]).read_bytes())',src],{cwd:root,encoding:'utf8'});
  assert.notEqual(r.status,0);assert.ok(r.stderr.includes('shape drift'),'strict adapter must reject unknown timer call count');
  assert.equal(sha(fs.readFileSync(upstream)),canonicalSha);
});
test('actual original loadSource handles generated lazy native logger without changing fixtures',()=>{
  const app=loader()('app.js');assert.equal(typeof app._elctonLog,'function');
  app.onCreate();assert.equal(app._elctonLogStatus().seq,0);app.onDestroy();
});
test('actual adapted app forwards fixed console markers, emits helper stages and destroys timers',()=>{
  const x=loggerHarness();const h=appHarness({log:x.L,config:enabled});
  // Use the same captured console realm as the actual generated logger.
  const source=fs.readFileSync(path.join(ability,'app.js'),'utf8').replace(/^import[^\n]*\n/gm,'').replace('export default','var app=');
  const ctx={L:x.L,logConfig:enabled,wearService:{},console:x.console};vm.runInNewContext(source+';this.result=app;',ctx);
  ctx.result.onCreate();x.console.info('WE SDK_UNVERSIONED');ctx.result._elctonLog('RX_HELLO',{bytes:4});
  assert.equal(ctx.result._elctonLogStatus().seq,4);assert.equal(x.forward[0][1],'Application onCreate');
  assert.ok(x.forward.some(row=>row[1]==='WE SDK_UNVERSIONED'));
  x.L.flush();x.fireMs(50);const rows=JSON.parse(x.requests[0].data).logs;
  assert.ok(rows.some(r=>r.tag==='WE/RX_HELLO' && r.msg==='bytes=4'));
  assert.ok(rows.some(r=>r.tag==='console' && r.msg==='WE SDK_UNVERSIONED'));
  ctx.result.onDestroy();assert.equal(x.timers.size,0);assert.equal(x.console.info,x.original.info);
});
test('approved numeric WE diagnostics follow existing metadata order without accepting native free text',()=>{
  const calls=[];const x=appHarness({log:{i:(...a)=>calls.push(a)}});
  const meta={v3:306,v2:2,v1:0,v0:5,service:'303',len2:0,len1:9,type2:0,type1:4,arg2:-206,arg1:'210301031',ms:1,attempt:2,bytes:3,count:4,code:5,ok:true};
  assert.equal(x.app._elctonLog('SDK_UNVERSIONED',meta),true);
  assert.equal(calls[0][1],'ok=true code=5 count=4 bytes=3 attempt=2 ms=1 arg1=210301031 arg2=-206 type1=4 type2=0 len1=9 len2=0 service=303 v0=5 v1=0 v2=2 v3=306');
  x.app._elctonLog('SDK_BAD',{arg1:'1000000000',arg2:'1e3',type1:true,type2:'１２',len1:'payload',len2:'-206',service:'3.0.3',v0:'',v1:'-',v2:' 3',v3:'9'});
  assert.equal(calls[1][1],'len2=-206 v3=9');
});
const APP_JS='assets/js/MainAbility/app.js',APP_MAP=APP_JS+'.map';
const PUBLIC_ENDPOINT='https://example.invalid/ELCTON_WE_LOG_ENDPOINT_PLACEHOLDER_20261115';
const PUBLIC_KEY='ELCTON_WE_WRITE_KEY_PLACEHOLDER_20261115';
function archiveFixture({bc=false,gzip=false,map=true,duplicate=false,quote='"'}={}) {
  const dir=fixture(),input=path.join(dir,'public.app'),output=path.join(dir,'local.app'),runtime=path.join(dir,'runtime.json');
  const js='var cfg={endpoint:'+quote+PUBLIC_ENDPOINT+quote+',key:'+quote+PUBLIC_KEY+quote+',app:"elcton",ver:"1.1.15"};'+(map?'\n//# sourceMappingURL=app.js.map':'');
  const contents={[APP_JS]:js,'config.json':fs.readFileSync(path.join(root,'entry/src/main/config.json'),'utf8'),'assets/js/MainAbility/pages/index/index.js':'var originalBusiness="UNCHANGED";','resources.index':'original-resource-bytes'};
  if(map)contents[APP_MAP]=JSON.stringify({version:3,file:'app.js',sources:['app.js'],sourcesContent:[js],names:[],mappings:'AAAA'});
  if(bc)contents['assets/js/MainAbility/pages/index/index.bc']='JRRY';
  const script='import sys,json,zipfile,io,gzip; p=json.load(sys.stdin); b=io.BytesIO(); z=zipfile.ZipFile(b,"w",zipfile.ZIP_DEFLATED); '+
    '[z.writestr(n,gzip.compress(s.encode()) if p["gzip"] and n.endswith("/app.js") else s.encode()) for n,s in p["files"].items()]; '+
    '(z.writestr("resources.index",b"duplicate") if p["duplicate"] else None); z.close(); '+
    'o=zipfile.ZipFile(p["output"],"w",zipfile.ZIP_DEFLATED); o.writestr("entry.hap",b.getvalue()); o.writestr("pack.info",b"OUTER_KEEP"); o.close()';
  const r=spawnSync('python',['-c',script],{input:JSON.stringify({files:contents,output:input,gzip,duplicate}),encoding:'utf8'});assert.equal(r.status,0);
  const config={endpoint:'https://fixture.invalid/watch-logger/index.php',write_key:'fixture-write-quote"-slash\\-0123456789',read_key:'fixture-READ-key-must-not-be-loaded'};
  fs.writeFileSync(runtime,JSON.stringify(config),{mode:0o600});return {dir,input,output,runtime,config,contents};
}
function archiveFiles(input) {
  const script='import sys,zipfile,io,json; o=zipfile.ZipFile(sys.argv[1]); z=zipfile.ZipFile(io.BytesIO(o.read("entry.hap"))); print(json.dumps({"inner":{n:z.read(n).decode() for n in z.namelist()},"outer":{n:o.read(n).decode() for n in o.namelist() if n!="entry.hap"}}))';
  const r=spawnSync('python',['-c',script,input],{encoding:'utf8'});assert.equal(r.status,0);return JSON.parse(r.stdout);
}
test('local configure patches only compiled app and its actual source map with escaped write-only literals',()=>{
  for(const quote of ['"',"'"]) {
    const p=archiveFixture({quote});const before=sha(fs.readFileSync(p.input)),secretBefore=sha(fs.readFileSync(p.runtime));
    const report=path.join(p.dir,'safe-report.json');const r=python('configure_we_logger_app.py',p.input,p.output,'--runtime-config',p.runtime,'--report',report);
    assert.equal(r.status,0,'compiled local configure pipeline missing: '+r.stderr);
    const out=archiveFiles(p.output);const ctx={};vm.runInNewContext(out.inner[APP_JS],ctx);
    assert.equal(ctx.cfg.key,p.config.write_key);assert.equal(ctx.cfg.endpoint,p.config.endpoint);
    assert.equal(ctx.cfg.app,'elcton');assert.equal(ctx.cfg.ver,'1.1.15');
    const mapContext={};vm.runInNewContext(JSON.parse(out.inner[APP_MAP]).sourcesContent[0],mapContext);
    assert.equal(mapContext.cfg.key,p.config.write_key);assert.equal(mapContext.cfg.endpoint,p.config.endpoint);
    for(const [n,b] of Object.entries(p.contents))if(n!==APP_JS && n!==APP_MAP)assert.equal(out.inner[n],b);
    assert.equal(out.outer['pack.info'],'OUTER_KEEP');assert.equal(sha(fs.readFileSync(p.input)),before);assert.equal(sha(fs.readFileSync(p.runtime)),secretBefore);
    const text=r.stdout+r.stderr+fs.readFileSync(report,'utf8');
    assert.ok(!text.includes(p.config.write_key) && !text.includes(p.config.read_key) && !text.includes(p.config.endpoint));
    assert.ok(!JSON.stringify(out).includes(p.config.read_key));
    const data=JSON.parse(fs.readFileSync(report));assert.deepEqual(data.changed_paths.sort(),[APP_JS,APP_MAP].sort());
    assert.equal(data.all_other_files_identical,true);assert.equal(data.write_only,true);
    assert.equal(fs.statSync(p.output).mode & 0o777,0o600);
  }
});
test('configure accepts real plain app.js without maps and does not invent a map',()=>{
  const p=archiveFixture({map:false});const r=python('configure_we_logger_app.py',p.input,p.output,'--runtime-config',p.runtime);
  assert.equal(r.status,0,'plain JS-only app must be configurable: '+r.stderr);
  assert.equal(APP_MAP in archiveFiles(p.output).inner,false);
});
test('configure rejects ANY bytecode or gzip payload before loading runtime or writing output',()=>{
  for(const opts of [{bc:true},{gzip:true}]) {
    const p=archiveFixture(opts);const before=sha(fs.readFileSync(p.input));
    // A missing runtime is intentional: package safety must be checked first.
    const r=python('configure_we_logger_app.py',p.input,p.output,'--runtime-config',path.join(p.dir,'does-not-exist.json'));
    assert.notEqual(r.status,0);assert.equal(fs.existsSync(p.output),false);assert.equal(sha(fs.readFileSync(p.input)),before);
    assert.ok((r.stdout+r.stderr).includes(opts.bc?'Bytecode refused':'Gzip refused'),'must be format refusal, not ENOENT');
  }
});
test('configure refuses duplicate ZIP names and mismatched actual-map placeholders without output',()=>{
  const p=archiveFixture({duplicate:true});let r=python('configure_we_logger_app.py',p.input,p.output,'--runtime-config',p.runtime);
  assert.notEqual(r.status,0);assert.equal(fs.existsSync(p.output),false);assert.ok((r.stdout+r.stderr).includes('Duplicate ZIP paths'));
  const bad=archiveFixture();const script='import sys,zipfile,io; p=sys.argv[1]; o=zipfile.ZipFile(p); outer={n:o.read(n) for n in o.namelist()}; o.close(); z=zipfile.ZipFile(io.BytesIO(outer["entry.hap"])); b=io.BytesIO(); d=zipfile.ZipFile(b,"w"); [(d.writestr(n,b"{}" if n.endswith("app.js.map") else z.read(n))) for n in z.namelist()]; d.close(); z.close(); o=zipfile.ZipFile(p,"w"); [o.writestr(n,b.getvalue() if n=="entry.hap" else data) for n,data in outer.items()]; o.close()';
  const m=spawnSync('python',['-c',script,bad.input],{encoding:'utf8'});assert.equal(m.status,0);
  r=python('configure_we_logger_app.py',bad.input,bad.output,'--runtime-config',bad.runtime);
  assert.notEqual(r.status,0);assert.equal(fs.existsSync(bad.output),false);assert.ok((r.stdout+r.stderr).includes('Actual source map refused'));
});
