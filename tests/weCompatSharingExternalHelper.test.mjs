// Synthetic QA only; the complete helper pin is independently copied from SDK evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import JSZip from '../tools/sign/node_modules/jszip/lib/index.js';
import {shareCompatApp} from '../scripts/share_we_compat_app.mjs';
const PAGE='assets/js/MainAbility/pages/phone-sync/phone-sync.js';
const APP='assets/js/MainAbility/app.js';
const HELPER_SHA='e282a73c6d4a635b6aa168ad8ff37d95bc71c3b9fd70b2f56caa63cdc4094bf3';
const HELPER='function(module){"use strict";function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}module.exports=_interopRequireDefault,module.exports.__esModule=true,module.exports["default"]=module.exports;function requireModule(moduleName){return requireNative(moduleName.slice(1))}}';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const source=fs.readFileSync(new URL('../entry/src/main/js/MainAbility/common/wearCompat.js',import.meta.url),'utf8');
const factory=source.replace(/^import[^\n]*\n/gm,'').replace('export default wearCompat;','exports["default"]=wearCompat;');
function bundle({helperId=143,requestedId=helperId,helper=HELPER,duplicate=false}={}){
  return '(function(modules){this.modules=modules;})({987:function(module,exports,__webpack_require__){var trace=__webpack_require__("trace");'+factory+'},831:function(module,exports,__webpack_require__){var _interopRequireDefault=__webpack_require__('+requestedId+');var _wearCompat=_interopRequireDefault(__webpack_require__(987));exports["default"]=void 0;var _default={_elctonWearCompat:function(identity,protocol,engine){return (0,_wearCompat["default"])(identity,protocol,engine);}};exports["default"]=_default;},'+helperId+':'+helper+(duplicate?','+helperId+':'+HELPER:'')+',999:function(module,exports,require){exports.value="SYNTHETIC_QA_ONLY";}});';
}
async function fixture(shape){
  const page=bundle(),app=bundle(shape),hap=new JSZip();
  hap.file(PAGE,page);hap.file(APP,app);hap.file('unchanged.bin',Buffer.from([0,255,17]));
  const map={version:3,sources:['webpack:///common/wearCompat.js'],sourcesContent:[source],names:[],mappings:''};
  hap.file(PAGE+'.map',JSON.stringify(map));
  const outer=new JSZip();outer.file('fixture.hap',await hap.generateAsync({type:'nodebuffer'}));
  return {bytes:await outer.generateAsync({type:'nodebuffer'}),app,page};
}
test('external helper has the independent complete SDK hash and quoted default export',()=>{
  assert.equal(Buffer.byteLength(HELPER),300);assert.equal(sha(HELPER),HELPER_SHA);
  const evidence=fs.readFileSync(new URL('../qa/we-handshake-20261115/evidence/sdk-parse-r2/pinned-babel-interop-module143.source.txt',import.meta.url),'utf8');
  assert.equal(evidence,HELPER);
});
for(const helperId of [143,714])test('external pinned Babel helper accepts requested literal module '+helperId,async()=>{
  const f=await fixture({helperId}),before=Buffer.from(f.bytes);
  const r=await shareCompatApp(f.bytes,{syntheticQA:true});
  assert.equal(r.record.syntheticQA,true);assert.equal(r.record.actualSDKVerified,false);assert.equal(r.record.nativeVerified,false);
  assert.equal(r.record.appSourceMethodHas,true);assert.equal(r.record.nonTargetModuleBytesEqual,true);assert.deepEqual(f.bytes,before);
  const outer=await JSZip.loadAsync(r.bytes),hap=await JSZip.loadAsync(await outer.file('fixture.hap').async('nodebuffer'));
  assert.equal(await hap.file(APP).async('string'),f.app);
  assert.deepEqual(await hap.file('unchanged.bin').async('nodebuffer'),Buffer.from([0,255,17]));
  const page=await hap.file(PAGE).async('string');
  assert.equal(page.slice(0,r.record.start),f.page.slice(0,r.record.start));
  assert.equal(page.slice(r.record.start+r.record.replacementBytes),f.page.slice(r.record.end));
  const map=JSON.parse(await hap.file(PAGE+'.map').async('string'));
  assert.equal(map.sourcesContent[map.sources.indexOf('webpack:///common/wearCompat.js')],source);
  // Exercise the actual quoted-default export and zero-call sequence, without native calls.
  const context={};vm.runInNewContext(f.app,context);
  const helperModule={exports:{}};context.modules[helperId](helperModule);
  assert.equal(helperModule.exports["default"],helperModule.exports);
  const calls=[],sentinel={},factory=(...args)=>{calls.push(args);return sentinel;},exports={};
  context.modules[831]({},exports,id=>id===helperId?helperModule.exports:factory);
  assert.equal(calls.length,0);const identity={},protocol={},engine={};
  assert.equal(exports.default._elctonWearCompat(identity,protocol,engine),sentinel);
  assert.equal(calls.length,1);assert.equal(calls[0][0],identity);assert.equal(calls[0][1],protocol);assert.equal(calls[0][2],engine);
});
for(const [label,shape] of [
  ['same spelling with malicious return',{helper:HELPER.replace('obj&&obj.__esModule?obj:{default:obj}','{default:function(){return "MALICIOUS"}}')}],
  ['requested module missing despite pinned helper at another ID',{requestedId:144}],
  ['ambiguous literal module ID',{duplicate:true}]
])test('external helper rejects '+label,async()=>{
  const f=await fixture(shape),before=Buffer.from(f.bytes);
  await assert.rejects(shareCompatApp(f.bytes,{syntheticQA:true}),/not linked/);
  assert.deepEqual(f.bytes,before);
});
