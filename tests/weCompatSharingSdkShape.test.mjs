// Synthetic QA only: reproduce actual Babel SDK syntax, not SDK/native provenance.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import JSZip from '../tools/sign/node_modules/jszip/lib/index.js';
import {shareCompatApp} from '../scripts/share_we_compat_app.mjs';

const PAGE='assets/js/MainAbility/pages/phone-sync/phone-sync.js';
const APP='assets/js/MainAbility/app.js';
const source=fs.readFileSync(new URL('../entry/src/main/js/MainAbility/common/wearCompat.js',import.meta.url),'utf8');
// Use the complete source factory, never a marker-only surrogate.
const completeFactory=source.replace(/^import[^\n]*\n/gm,'').replace('export default wearCompat;','exports["default"]=wearCompat;');
const lazy=member=>'function(identity,protocol,engine){return _wearCompat'+member+'(identity,protocol,engine);}';
function bundle({root='["default"]',member='["default"]',declarations='',decoy=false}={}){
  return '(function(modules){this.modules=modules;})({"compat":function(module,exports,require){var trace=require("trace");'+completeFactory+'},"app":function(module,exports,require){function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj};}var _wearCompat=_interopRequireDefault(require("compat"));'+declarations+'exports'+root+'=void 0;'+(decoy?'var unrelated={_elctonWearCompat:'+lazy('["default"]')+'};':'')+'var _default={'+(decoy?'':'_elctonWearCompat:'+lazy(member))+'};exports'+root+'=_default;},"untouched":function(module,exports,require){exports.value="SYNTHETIC_QA_ONLY";}});';
}
async function fixture(shape){
  const page=bundle(),app=bundle(shape),hap=new JSZip();
  hap.file(PAGE,page);hap.file(APP,app);
  const map={version:3,sources:['webpack:///common/wearCompat.js','webpack:///untouched.js'],sourcesContent:[source,'SYNTHETIC_QA_ONLY'],names:[],mappings:''};
  hap.file(PAGE+'.map',JSON.stringify(map));
  const outer=new JSZip();outer.file('fixture.hap',await hap.generateAsync({type:'nodebuffer'}));
  return {bytes:await outer.generateAsync({type:'nodebuffer'}),app,map};
}

for(const [label,shape] of [
  ['literal default export root',{root:'["default"]',member:'.default'}],
  ['literal default factory resolver',{root:'.default',member:'["default"]'}],
  ['actual Babel literal default root and lazy interop import',{root:'["default"]',member:'["default"]'}]
])test('SDK shape accepts '+label,async()=>{
  const f=await fixture(shape),before=Buffer.from(f.bytes);
  const result=await shareCompatApp(f.bytes,{syntheticQA:true});
  assert.equal(result.record.syntheticQA,true);assert.equal(result.record.actualSDKVerified,false);
  assert.equal(result.record.appSourceMethodHas,true);assert.equal(result.record.nonTargetModuleBytesEqual,true);
  assert.deepEqual(f.bytes,before);
  const outer=await JSZip.loadAsync(result.bytes),hap=await JSZip.loadAsync(await outer.file('fixture.hap').async('nodebuffer'));
  assert.equal(await hap.file(APP).async('string'),f.app);
  const map=JSON.parse(await hap.file(PAGE+'.map').async('string'));
  assert.equal(map.sources.length,map.sourcesContent.length);assert.ok(map.sourcesContent.every(v=>typeof v==='string'));
  for(let i=0;i<f.map.sources.length;i++)assert.equal(map.sourcesContent[map.sources.indexOf(f.map.sources[i])],f.map.sourcesContent[i]);
  // The Babel app owner remains lazy and forwards exact references in order.
  const context={};vm.runInNewContext(f.app,context);
  const calls=[],sentinel={},factory=(...args)=>{calls.push(args);return sentinel;},exports={};
  context.modules.app({},exports,()=>factory);assert.equal(calls.length,0);
  const identity={},protocol={},engine={};
  assert.equal(exports.default._elctonWearCompat(identity,protocol,engine),sentinel);
  assert.equal(calls.length,1);assert.equal(calls[0][0],identity);assert.equal(calls[0][1],protocol);assert.equal(calls[0][2],engine);
});

for(const [label,shape] of [
  ['computed export variable even when its value is default',{root:'[defaultKey]',declarations:'var defaultKey="default";'}],
  ['computed factory variable even when its value is default',{member:'[defaultKey]',declarations:'var defaultKey="default";'}],
  ['wrong literal export key',{root:'["notDefault"]'}],
  ['wrong literal factory key',{member:'["notDefault"]'}],
  ['unrelated static owner decoy with an empty proper exported root',{decoy:true}]
])test('SDK shape rejects '+label,async()=>{
  const f=await fixture(shape),before=Buffer.from(f.bytes);
  await assert.rejects(shareCompatApp(f.bytes,{syntheticQA:true}),/not linked/);
  assert.deepEqual(f.bytes,before);
});
