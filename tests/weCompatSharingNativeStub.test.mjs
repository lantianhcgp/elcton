// Synthetic QA only: complete source factory + independently pinned SDK helper.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import JSZip from '../tools/sign/node_modules/jszip/lib/index.js';
import {shareCompatApp} from '../scripts/share_we_compat_app.mjs';
const PAGE='assets/js/MainAbility/pages/phone-sync/phone-sync.js',APP='assets/js/MainAbility/app.js';
const STUB='function requireModule(moduleName){return requireNative(moduleName.slice(1))}';
const HELPER='function(module){"use strict";function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}module.exports=_interopRequireDefault,module.exports.__esModule=true,module.exports["default"]=module.exports;'+STUB+'}';
const source=fs.readFileSync(new URL('../entry/src/main/js/MainAbility/common/wearCompat.js',import.meta.url),'utf8');
const factory=source.replace(/^import[^\n]*\n/gm,'').replace('export default wearCompat;','exports["default"]=wearCompat;');
function bundle(tail=STUB){
  return '(function(modules){this.modules=modules;})({987:function(module,exports,require){var trace=require("trace");'+factory+tail+'},831:function(module,exports,require){var interop=require(143);var compat=interop(require(987));exports["default"]={_elctonWearCompat:function(identity,protocol,engine){return (0,compat["default"])(identity,protocol,engine);}};},143:'+HELPER+',999:function(module,exports,require){exports.value="SYNTHETIC_QA_ONLY";}});';
}
async function fixture({pageTail=STUB,appTail=STUB}={}){
  const page=bundle(pageTail),app=bundle(appTail),hap=new JSZip();
  hap.file(PAGE,page);hap.file(APP,app);hap.file('unchanged.bin',Buffer.from([0,255,17]));
  hap.file(PAGE+'.map',JSON.stringify({version:3,sources:['webpack:///common/wearCompat.js'],sourcesContent:[source],names:[],mappings:''}));
  const outer=new JSZip();outer.file('fixture.hap',await hap.generateAsync({type:'nodebuffer'}));
  return {bytes:await outer.generateAsync({type:'nodebuffer'}),page,app};
}
test('fixed SDK stub is independently evidenced and helper stays fully pinned',()=>{
  const evidence=fs.readFileSync(new URL('../qa/we-handshake-20261115/evidence/sdk-parse-r2/pinned-babel-interop-module143.source.txt',import.meta.url),'utf8');
  assert.equal(HELPER,evidence);assert.ok(evidence.includes(STUB));
  assert.equal(crypto.createHash('sha256').update(HELPER).digest('hex'),'e282a73c6d4a635b6aa168ad8ff37d95bc71c3b9fd70b2f56caa63cdc4094bf3');
});
for(const tail of [STUB,'function requireModule(moduleName) { return requireNative(moduleName.slice(1)); }'])test('accepts only unreferenced exact SDK declaration: '+tail,async()=>{
  const f=await fixture({pageTail:tail,appTail:tail}),before=Buffer.from(f.bytes);
  const r=await shareCompatApp(f.bytes,{syntheticQA:true});
  assert.equal(r.record.syntheticQA,true);assert.equal(r.record.actualSDKVerified,false);assert.equal(r.record.nativeVerified,false);
  assert.equal(r.record.nonTargetModuleBytesEqual,true);assert.deepEqual(f.bytes,before);
  const outer=await JSZip.loadAsync(r.bytes),hap=await JSZip.loadAsync(await outer.file('fixture.hap').async('nodebuffer'));
  assert.equal(await hap.file(APP).async('string'),f.app);assert.deepEqual(await hap.file('unchanged.bin').async('nodebuffer'),Buffer.from([0,255,17]));
  const page=await hap.file(PAGE).async('string');
  assert.equal(page.slice(0,r.record.start),f.page.slice(0,r.record.start));assert.equal(page.slice(r.record.start+r.record.replacementBytes),f.page.slice(r.record.end));
  const map=JSON.parse(await hap.file(PAGE+'.map').async('string'));
  assert.equal(map.sourcesContent[map.sources.indexOf('webpack:///common/wearCompat.js')],source);
  let nativeCalls=0;const context={requireNative(){nativeCalls++;throw Error('native initialization');}};
  vm.runInNewContext(f.app,context);const exp={};context.modules[987]({},exp,()=>({log(){}}));
  assert.equal(typeof exp.default,'function');assert.equal(nativeCalls,0);
  const helper={exports:{}};context.modules[143](helper);const owner={};context.modules[831]({},owner,id=>id===143?helper.exports:exp);
  assert.equal(typeof owner.default._elctonWearCompat,'function');assert.equal(nativeCalls,0);
});
const rejected=[
  ['actual top-level requireNative',STUB+';requireNative("system.wearengine");'],
  ['requireModule invocation',STUB+';requireModule("system.wearengine");'],
  ['other native call',STUB+';function other(){return requireNative("system.device");}'],
  ['system module token',STUB+';var nativeName="@system.wearengine";'],
  ['renamed parameter','function requireModule(name){return requireNative(name.slice(1))}'],
  ['extra parameter','function requireModule(moduleName,extra){return requireNative(moduleName.slice(1))}'],
  ['multiple statements','function requireModule(moduleName){var x=1;return requireNative(moduleName.slice(1))}'],
  ['wrong slice argument',STUB.replace('slice(1)','slice(0)')],
  ['computed slice member',STUB.replace('.slice','["slice"]')],
  ['function expression','var requireModule='+STUB+';'],
  ['nested declaration','function outer(){'+STUB+'}'],
  ['shadowed identifier',STUB+';function shadow(requireModule){}'],
  ['reassignment',STUB+';requireModule=function(){};'],
  ['identifier alias',STUB+';var alias=requireModule;'],
  ['duplicate declaration',STUB+STUB]
];
for(const [label,tail] of rejected)for(const side of ['pageTail','appTail'])test('rejects '+side+' '+label,async()=>{
  const f=await fixture({[side]:tail}),before=Buffer.from(f.bytes);
  await assert.rejects(shareCompatApp(f.bytes,{syntheticQA:true}),/native initialization in compat module/);
  assert.deepEqual(f.bytes,before);
});
