// Execute the untouched CI app/page bundles through the pinned upstream hmlwsim Sandbox.
// Explicit API fixtures: NOT Bluetooth, device filesystem, heap, UI, or physical Wear Engine evidence.
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {setImmediate as flush} from 'node:timers/promises';
import {fakeFile} from '../../tests/loadSource.mjs';
const [payloadDir,output]=process.argv.slice(2);
assert(payloadDir&&output,'PAYLOAD_DIR OUTPUT required');
const host=fs.readFileSync('.qa-hmlwsim/js/runtime/sandbox.js','utf8');
const app=fs.readFileSync(payloadDir+'/app.js','utf8');
const page=fs.readFileSync(payloadDir+'/phone.js','utf8');
const rows=[];
for(const mode of ['modern401','legacy303','send206','badVersion','pendingRead']){
 const calls=[],sent=[],errors=[],timers=new Map();let next=0,inbox=null;
 const disk=fakeFile();
 if(mode==='pendingRead')disk.api.get=()=>{};
 const bus={
  unsubscribeMsg(){calls.push('unsub');inbox=null;},
  subscribeMsg(options){calls.push('sub');inbox=options;options.success({isRegister:true});},
  sendMsg(options){calls.push('send');sent.push(JSON.parse(options.message));if(mode==='send206')options.fail('fixture',206);else options.success();}
 };
 const engine={
  getWearEngineVersion(options){assert.equal(options.sdkVersion,'3');calls.push('version');options.complete(mode==='badVersion'?'garbage.401':mode==='legacy303'?'5.0.2.303':'5.0.2.401');},
  setPackageName(options){calls.push('pkg');options.complete();},
  setFingerprint(options){calls.push('cert');assert.equal(options.appName,'com.hcbiu.elcton');options.complete();},
  ...(mode==='legacy303'?{}:bus)
 };
 const noop={},ctx={
  console:{log(){},info(){},warn(){},error(...args){errors.push(args.map(String).join(' '));}},
  ApiSimApp:noop,ApiSimBattery:noop,ApiSimBrightness:noop,ApiSimDevice:noop,
  ApiSimFile:disk.api,ApiSimStorage:noop,ApiSimVibrator:noop,ApiSimWearengine:bus,
  DeviceFeatureAppLifecycle:{setAppData(){}},DeviceFeaturePageNav:{setAppData(){}},
  ApiRegistry:{resolve(name){
   if(name==='system.device')return {getInfo(o){o.success({windowWidth:412,windowHeight:484});}};
   if(name==='system.file')return disk.api;
   if(name==='system.wearengine')return engine;
   if(name==='system.router')return {getParams(){return {};},replace(){throw Error('No routing authorized in this control host');}};
   throw Error('Unmodelled native API '+name);
  }},
  setTimeout(fn,ms){const id=next++;timers.set(id,{fn,ms});return id;},
  clearTimeout(id){timers.delete(id);},setInterval(){throw Error('No interval expected');},clearInterval(){},
  Promise,Math,Date,JSON,String,Number,Boolean,Array,Object,RegExp,Error,parseInt,parseFloat,isNaN,
  encodeURI,encodeURIComponent,decodeURI,decodeURIComponent
 };
 ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(host,ctx);
 ctx.Sandbox.initApp(app,{});
 assert.equal(ctx.Sandbox.getLastError(),null);
 assert.equal(typeof ctx.$app._elctonWearChannel,'function','Compiled app factory was not exported by real Sandbox');
 const view=ctx.Sandbox.initPage(page,'pages/phone-sync/phone-sync',{}),data=view.data;
 assert.equal(ctx.Sandbox.getLastError(),null);view.onInit();assert.equal(data.ready,true);
 view.onListen();await flush();await flush();
 if(mode==='badVersion'){
  assert.equal(data.listening,false);assert.match(data.detail,/VERSION/);assert(!calls.includes('sub'));assert.equal(timers.size,0);
 }else if(mode==='pendingRead'){
  assert.equal(sent.length,0);assert(data._receiver.isPreparing());
  const timer=timers.get(data._timer);assert(timer);timers.delete(data._timer);timer.fn();
  assert.equal(data.listening,false);assert.equal(timers.size,0);
 }else{
  assert.deepEqual(calls.slice(0,mode==='legacy303'?4:5),mode==='legacy303'?['version','pkg','cert','sub']:['version','pkg','cert','unsub','sub']);
  assert.equal(data.listening,true);assert.equal(sent[0].type,'READY');
  if(mode==='send206')assert.match(data.detail,/SEND_206/);else{
   assert.match(data.detail,/READY_OK/);
   const count=sent.length;inbox.success({message:JSON.stringify({protocol:'elcton.sync',version:1,sender:'phone',type:'HELLO',transferId:''})});
   await flush();await flush();assert.equal(sent.length,count+1);assert.equal(sent.at(-1).type,'READY');
   assert.match(data.detail,/HELLO/);
   const timer=timers.get(data._timer);assert(timer);timers.delete(data._timer);timer.fn();
   assert.equal(data.listening,true);assert.equal(data.phase,'ready');assert.equal(timers.size,0);
  }
 }
 const result={mode,phase:data.phase,detail:data.detail,calls,sentTypes:sent.map(s=>s.type)};
 view.onHide();assert.equal(data.listening,false);assert.equal(timers.size,0);view.onDestroy();ctx.Sandbox.destroy();assert.equal(timers.size,0);assert.deepEqual(errors,[]);
 rows.push(result);
}
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const result={passed:true,app_js_sha256:sha(app),page_js_sha256:sha(page),sandbox_sha256:sha(host),modes:rows,
 scope:'Original compiled bundles with real pinned hmlwsim Sandbox and explicit API contract fixtures; no render/browser, Bluetooth, native I/O, heap or device test.'};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:true,modes:rows.map(r=>r.mode),app:result.app_js_sha256,page:result.page_js_sha256,scope:result.scope}));
