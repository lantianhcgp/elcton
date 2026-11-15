// Independent synthetic QA: parse dynamic tokens, never execute payload strings.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import JSZip from '../tools/sign/node_modules/jszip/lib/index.js';
import {shareCompatApp} from '../scripts/share_we_compat_app.mjs';
const PAGE='assets/js/MainAbility/pages/phone-sync/phone-sync.js',APP='assets/js/MainAbility/app.js';
const STUB='function requireModule(moduleName){return requireNative(moduleName.slice(1))}';
const HELPER='function(module){"use strict";function _interopRequireDefault(obj){return obj&&obj.__esModule?obj:{default:obj}}module.exports=_interopRequireDefault,module.exports.__esModule=true,module.exports["default"]=module.exports;'+STUB+'}';
const source=fs.readFileSync(new URL('../entry/src/main/js/MainAbility/common/wearCompat.js',import.meta.url),'utf8');
const factory=source.replace(/^import[^\n]*\n/gm,'').replace('export default wearCompat;','exports["default"]=wearCompat;');
function bundle(tail){
  return '(function(modules){this.modules=modules;})({987:function(module,exports,require){var trace=require("trace");'+factory+tail+'},831:function(module,exports,require){var interop=require(143);var compat=interop(require(987));exports["default"]={_elctonWearCompat:function(identity,protocol,engine){return (0,compat["default"])(identity,protocol,engine);}};},143:'+HELPER+'});';
}
async function fixture({pageTail=STUB,appTail=STUB}={}){
  const hap=new JSZip();hap.file(PAGE,bundle(pageTail));hap.file(APP,bundle(appTail));
  hap.file(PAGE+'.map',JSON.stringify({version:3,sources:['webpack:///common/wearCompat.js'],sourcesContent:[source],names:[],mappings:''}));
  const outer=new JSZip();outer.file('fixture.hap',await hap.generateAsync({type:'nodebuffer'}));
  return outer.generateAsync({type:'nodebuffer'});
}
for(const [label,payload] of [
  ['direct eval',';eval("require"+"Module")("system.wearengine");'],
  ['Function constructor',';Function("return require"+"Module")()("system.wearengine");']
])for(const side of ['appTail','pageTail'])test('rejects '+side+' dynamic reachability via '+label,async()=>{
  const bytes=await fixture({[side]:STUB+payload}),before=Buffer.from(bytes);
  await assert.rejects(shareCompatApp(bytes,{syntheticQA:true}),new RegExp((side==='appTail'?'app':'page')+': native initialization in compat module'));
  assert.deepEqual(bytes,before);
});
test('unreferenced fixed inert stub remains accepted without dynamic execution',async()=>{
  const bytes=await fixture(),before=Buffer.from(bytes);
  const result=await shareCompatApp(bytes,{syntheticQA:true});
  assert.equal(result.record.nonTargetModuleBytesEqual,true);
  assert.equal(result.record.syntheticQA,true);
  assert.equal(result.record.nativeVerified,false);
  assert.deepEqual(bytes,before);
});
