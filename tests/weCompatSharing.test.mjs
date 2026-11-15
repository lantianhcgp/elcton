// Synthetic packing fixtures are QA only, never actual SDK/JerryScript/native evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {loader} from './loadSource.mjs';
import JSZip from '../tools/sign/node_modules/jszip/lib/index.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ability=path.join(root,'entry/src/main/js/MainAbility');
const script=path.join(root,'scripts/share_we_compat_app.mjs');
// The original body is pinned below; do not derive expectations from changed code.
// Pin the pre-change body independently of the implementation under test.
const originalBodyHash='5cb48bd88d4a57bfd72c87a4572743af67725d8dd2c60217fc5817e6b194f529';
const sha=async s=>(await import('node:crypto')).createHash('sha256').update(s).digest('hex');
const identity={phonePackage:'com.hcbiu.elcton',phoneFingerprint:'a'.repeat(64)};
const read=n=>fs.readFileSync(path.join(ability,n),'utf8');
async function packer(){assert.ok(fs.existsSync(script),'host sharing step is missing');return import(script);}
function syntheticBundle(compat,moduleName='compat'){
  return '(function(modules){this.modules=modules;})({'+JSON.stringify(moduleName)+':function(module,exports,require){var trace=require("trace");'+compat.replace(/^import[^\n]*\n/gm,'').replace('export default wearCompat;','exports.default=wearCompat;')+'},"app":function(module,exports,require){exports.default={_elctonWearCompat:require('+JSON.stringify(moduleName)+').default};},"untouched":function(module,exports,require){exports.value="SYNTHETIC_QA_ONLY";}});';
}
async function fixture(override={}){
  const compat=read('common/wearCompat.js'),page=syntheticBundle(compat),app=syntheticBundle(compat);
  const hap=new JSZip();hap.file('assets/js/MainAbility/pages/phone-sync/phone-sync.js',override.page??page);hap.file('assets/js/MainAbility/app.js',override.app??app);
  hap.file('assets/js/MainAbility/pages/phone-sync/phone-sync.js.map',JSON.stringify({version:3,sources:['webpack:///common/wearCompat.js','webpack:///untouched.js'],sourcesContent:[compat,'SYNTHETIC_QA_ONLY'],names:[],mappings:''}));
  hap.file('assets/config.json','SYNTHETIC_QA_ONLY_CONFIG');hap.file('assets/layout.bin',Buffer.from([0,255,17]));
  const outer=new JSZip();outer.file('fixture.hap',await hap.generateAsync({type:'nodebuffer'}));outer.file('manifest.json','SYNTHETIC_QA_ONLY');
  return {bytes:await outer.generateAsync({type:'nodebuffer'}),page,app};
}

// R3 additions only: synthetic counterexamples exercise the packer, not SDK provenance.
async function ownerFixture(owner, declarations=''){
  const f=await fixture();
  return fixture({app:f.app.replace('exports.default={_elctonWearCompat:require("compat").default};',declarations+'exports.default={'+owner+'};')});
}
async function mapFixture(map){
  const f=await fixture(),outer=await JSZip.loadAsync(f.bytes);
  const hap=await JSZip.loadAsync(await outer.file('fixture.hap').async('nodebuffer'));
  const name='assets/js/MainAbility/pages/phone-sync/phone-sync.js.map';
  if(map===undefined)hap.remove(name);else hap.file(name,JSON.stringify(map));
  outer.file('fixture.hap',await hap.generateAsync({type:'nodebuffer'}));
  return outer.generateAsync({type:'nodebuffer'});
}
test('R3 unrelated factory require cannot attest an inert owner',async()=>{
  const {shareCompatApp}=await packer();
  const f=await ownerFixture('_elctonWearCompat:function(){return {};},unrelated:require("compat").default');
  await assert.rejects(shareCompatApp(f.bytes,{syntheticQA:true}),/not linked/);
});
test('R3 lazy wrapper must delegate the same three parameters in order',async()=>{
  const {shareCompatApp}=await packer();
  const f=await ownerFixture('_elctonWearCompat:function(identity,protocol,engine){return wearCompat(protocol,identity,engine);}','var wearCompat=require("compat").default;');
  await assert.rejects(shareCompatApp(f.bytes,{syntheticQA:true}),/not linked/);
});
test('R3 current lazy wrapper and explicit Babel import aliases are accepted without provenance claims',async()=>{
  const {shareCompatApp}=await packer();
  for(const declarations of ['var wearCompat=require("compat").default;','var imported=require("compat");var alias=imported;var wearCompat=alias.default;']){
    const f=await ownerFixture('_elctonWearCompat:function(identity,protocol,engine){return wearCompat(identity,protocol,engine);}',declarations);
    const r=await shareCompatApp(f.bytes,{syntheticQA:true});
    assert.equal(r.record.actualSDKVerified,false);assert.equal(r.record.syntheticQA,true);
  }
});
test('R3 every original map source requires string content, including null and missing maps',async()=>{
  const {shareCompatApp}=await packer();
  for(const map of [{version:3,sources:['original.js'],sourcesContent:[null],names:[],mappings:''},{version:3,sources:['original.js'],names:[],mappings:''},undefined]){
    await assert.rejects(shareCompatApp(await mapFixture(map),{syntheticQA:true}),/includeSources/);
  }
});
test('R3 retained original map contents are verbatim strings',async()=>{
  const {shareCompatApp}=await packer();
  const content='original\n完整 source \u0000';
  const bytes=await mapFixture({version:3,sources:['original.js'],sourcesContent:[content],names:[],mappings:''});
  const r=await shareCompatApp(bytes,{syntheticQA:true}),outer=await JSZip.loadAsync(r.bytes);
  const hap=await JSZip.loadAsync(await outer.file('fixture.hap').async('nodebuffer'));
  const map=JSON.parse(await hap.file('assets/js/MainAbility/pages/phone-sync/phone-sync.js.map').async('string'));
  assert.equal(map.sourcesContent[map.sources.indexOf('original.js')],content);
  assert.ok(map.sourcesContent.every(value=>typeof value==='string'));
});

test('compat is the entire unchanged bounded factory, dependency injected and owned by app without native initialization',async()=>{
  assert.ok(fs.existsSync(path.join(ability,'common/wearCompat.js')),'app-owned full compatibility factory is missing');
  const source=read('common/wearCompat.js');
  const body=source.slice(source.indexOf('    var open = false'),source.lastIndexOf('\n}\nexport default'));
  assert.equal(await sha(body),originalBodyHash,'all original control flow/diagnostics/summary/generation must remain byte-identical');
  assert.match(source,/function wearCompat\(identity, protocol, engine\)/);
  assert.doesNotMatch(source,/@system\.|requireNative|import .*wearProtocol/);
  const app=read('app.js');assert.match(app,/import wearCompat from '\.\/common\/wearCompat\.js'/);assert.match(app,/_elctonWearCompat:/);assert.match(app,/_elctonWearChannel: wearService/);
  assert.doesNotMatch(app,/@system\.wearengine|requireNative/);
  let nativeCalls=0;
  const engine=new Proxy({}, {get(){nativeCalls++;throw Error('must not initialize native engine');}});
  assert.equal(typeof loader({wearengine:engine})('common/wearCompat.js'),'function');assert.equal(nativeCalls,0);
  const sentinel={},args=[];
  const stripped=app.replace(/^import[^\n]*\n/gm,'').replace('export default','var app =');
  const context={wearService:{},wearCompat:function(...a){args.push(a);return sentinel;},L:{},logConfig:{}};
  vm.runInNewContext(stripped+';this.result=app;',context);assert.equal(args.length,0,'app factory must be lazy');
  const proto={},native={};assert.equal(context.result._elctonWearCompat(identity,proto,native),sentinel);
  assert.equal(args[0][0],identity);assert.equal(args[0][1],proto);assert.equal(args[0][2],native);
});

test('source bridge preserves exact protocol/engine references and all unversioned channel behavior',()=>{
  assert.ok(fs.existsSync(path.join(ability,'common/wearCompat.js')),'compat dependency missing');
  const calls=[],app={},engine={setPackageName(p){calls.push('PKG');p.complete();},setFingerprint(p){calls.push('CERT');p.complete();},subscribeMsg(p){calls.push('REG');p.success({isRegister:true});},sendMsg(p){calls.push('SEND');p.success();},unsubscribeMsg(){calls.push('CLOSE');}};
  const load=loader({app,wearengine:engine});const protocol=load('common/wearProtocol.js'),compat=load('common/wearCompat.js');
  let args;app._elctonWearCompat=(...a)=>{args=a;return compat(...a);};
  const connection=load('common/wearChannel.js')(identity);connection.open(()=>{},e=>assert.equal(e,null));
  assert.deepEqual(calls,['PKG','CERT','REG']);assert.match(connection.summary(),/UNVERSIONED.*PKG.*CERT.*REG/);assert.equal(connection.isNegotiated(),false);
  connection.send({sender:'watch',type:'READY'},e=>assert.equal(e,null));connection.close();
  assert.deepEqual(calls,['PKG','CERT','REG','SEND','CLOSE']);
  // Source fallback keeps legacy loader callers compatible. Actual packed bridge below owns dispatch.
  if(args){assert.equal(args[0],identity);assert.equal(args[1],protocol);assert.equal(args[2],engine);}
});

test('packing replaces exactly the pinned page module, preserves app factory and every non-target resource/source',async()=>{
  const {shareCompatApp}=await packer();const f=await fixture();const result=await shareCompatApp(f.bytes,{syntheticQA:true});
  assert.equal(result.record.syntheticQA,true);assert.equal(result.record.actualSDKVerified,false);
  const unproven=await shareCompatApp(f.bytes);assert.equal(unproven.record.actualSDKVerified,false,'shape alone never proves SDK provenance');
  assert.equal(result.record.matches,1);assert.ok(result.record.appSourceMethodHas);assert.ok(result.record.after<result.record.before);
  const oldOuter=await JSZip.loadAsync(f.bytes),newOuter=await JSZip.loadAsync(result.bytes);
  assert.equal(await newOuter.file('manifest.json').async('string'),await oldOuter.file('manifest.json').async('string'));
  const oldHap=await JSZip.loadAsync(await oldOuter.file('fixture.hap').async('nodebuffer')),newHap=await JSZip.loadAsync(await newOuter.file('fixture.hap').async('nodebuffer'));
  const pageName='assets/js/MainAbility/pages/phone-sync/phone-sync.js';
  for(const entry of Object.values(oldHap.files))if(!entry.dir&&entry.name!==pageName&&entry.name!==pageName+'.map')assert.deepEqual(await newHap.file(entry.name).async('nodebuffer'),await entry.async('nodebuffer'),entry.name);
  const page=await newHap.file(pageName).async('string');assert.ok(page.includes('_elctonWearCompat'));assert.ok(!page.includes('BUS_UNVERSIONED'));
  assert.equal(page.slice(0,result.record.start),f.page.slice(0,result.record.start));assert.equal(page.slice(result.record.start+result.record.replacementBytes),f.page.slice(result.record.end));
  const map=JSON.parse(await newHap.file(pageName+'.map').async('string'));assert.ok(map.sources.includes('webpack:///common/wearCompat.js'));assert.ok(map.sources.includes('webpack:///untouched.js'));assert.equal(map.sources.length,map.sourcesContent.length);
  const context={};vm.runInNewContext(page,context);const module={exports:{}};context.modules.compat(module,module.exports,()=>({log(){}}));
  const bridge=module.exports.default;const sentinel={},proto={},engine={},calls=[];
  context.$app={$def:{_elctonWearCompat(...a){calls.push(a);return sentinel;}}};assert.equal(bridge(identity,proto,engine),sentinel);assert.equal(calls[0][0],identity);assert.equal(calls[0][1],proto);assert.equal(calls[0][2],engine);
  context.$app={_elctonWearCompat(...a){calls.push(a);return sentinel;}};assert.equal(bridge(identity,proto,engine),sentinel);
  for(const owner of [undefined,{},{$def:{}}]){context.$app=owner;const closed=bridge(identity,proto,engine);let error;closed.open(()=>assert.fail('must not deliver'),e=>error=e);assert.equal(error,'APP_COMPAT_UNAVAILABLE');assert.doesNotThrow(()=>closed.close());assert.equal(closed.send,undefined);}
});

test('packing fails closed for absent/ambiguous/drifted modules or missing app owner and never mutates the input',async()=>{
  const {shareCompatApp}=await packer();const f=await fixture();const original=Buffer.from(f.bytes);
  for(const override of [{page:f.page.replaceAll('BUS_UNVERSIONED','BUS_CHANGED')},{app:f.app.replaceAll('_elctonWearCompat','_wrongOwner')},{app:f.app.replaceAll('SEND_206','SEND_208')},{page:f.page.replace('"untouched":function','"duplicate":'+f.page.match(/"compat":(function[\s\S]*?),"app":/)[1]+',"untouched":function')}]){
    const bad=await fixture(override);await assert.rejects(shareCompatApp(bad.bytes,{syntheticQA:true}));
  }
  assert.deepEqual(f.bytes,original);
});

// R4 additions only: the owner must belong to the exported application root.
test('R4 decoy object cannot attest the exported inert application owner',async()=>{
  const {shareCompatApp}=await packer(),f=await fixture();
  const app=f.app.replace('exports.default={_elctonWearCompat:require("compat").default};','var unrelated={_elctonWearCompat:require("compat").default};exports.default={_elctonWearCompat:function(){return {};}};');
  const bad=await fixture({app});
  await assert.rejects(shareCompatApp(bad.bytes,{syntheticQA:true}),/not linked/);
});
test('R4 explicit exported application aliases retain Babel lazy factory ownership',async()=>{
  const {shareCompatApp}=await packer(),f=await fixture();
  const app=f.app.replace('exports.default={_elctonWearCompat:require("compat").default};','function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}var imported=_interopRequireDefault(require("compat"));var application={_elctonWearCompat:function(identity,protocol,engine){return imported.default(identity,protocol,engine);}};var _default=application;exports.default=_default;');
  const r=await shareCompatApp((await fixture({app})).bytes,{syntheticQA:true});
  assert.equal(r.record.appSourceMethodHas,true);
  assert.equal(r.record.actualSDKVerified,false);
});
