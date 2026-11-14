import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as flush} from 'node:timers/promises';
import {loader,fakeFile} from './loadSource.mjs';
const identity={phonePackage:'com.hcbiu.elcton',phoneFingerprint:'a'.repeat(64)};
function appLoader(system){const app={};const load=loader({...system,app});app.$def=load('app.js');return load;}

test('malformed numeric-looking service versions never qualify as negotiated registrations',()=>{
 for(const version of ['garbage.401','5.0.0.0x191','5..0.401','5.0.0.4e2','5.0.0.+401','5.0.0. 401']){
  let query,registered=0,error;const engine={getWearEngineVersion:p=>query=p.complete,setPackageName:p=>p.complete(),setFingerprint:p=>p.complete(),unsubscribeMsg(){},subscribeMsg(p){registered++;p.success({isRegister:true});},sendMsg(p){p.success();}};
  const c=appLoader({wearengine:engine})('common/wearChannel.js')(identity);c.open(()=>{},e=>error=e);query(version);
  assert.ok(error,version);assert.equal(registered,0,version);assert.equal(c.isNegotiated(),false);c.close();
 }
});

test('a stalled initial or later HELLO storage query keeps its finite deadline instead of looking idle',async()=>{
 for(const initial of [true,false]){
  const timers=new Map();let sequence=0,query,inbox,stall=initial;
  const oldSet=globalThis.setTimeout,oldClear=globalThis.clearTimeout;
  globalThis.setTimeout=(callback,ms)=>{const id=sequence++;timers.set(id,{callback,ms});return id;};globalThis.clearTimeout=id=>timers.delete(id);
  const file=fakeFile();const get=file.api.get;file.api.get=p=>{if(!stall)get(p);};
  const engine={getWearEngineVersion:p=>query=p.complete,setPackageName:p=>p.complete(),setFingerprint:p=>p.complete(),unsubscribeMsg(){},subscribeMsg(p){inbox=p;p.success({isRegister:true});},sendMsg:p=>p.success()};
  const spec=appLoader({wearengine:engine,file:file.api,device:{getInfo:p=>p.success({windowWidth:412,windowHeight:484,screenShape:'rect'})},router:{replace(){}}})('pages/phone-sync/phone-sync.js');
  const page={...spec,...spec.data};delete page.data;
  try{
   page.onInit();page.onListen();query('5.0.0.401');await flush();
   if(!initial){stall=true;inbox.success({message:JSON.stringify({protocol:'elcton.sync',version:1,sender:'phone',type:'HELLO',transferId:''})});await flush();}
   const id=page._timer,slot=timers.get(id);assert.equal(slot.ms,30000);timers.delete(id);slot.callback();
   assert.equal(page.listening,false,'pending query is initialization, not idle');assert.equal(page.phase,'error');assert.equal(timers.size,0);
  }finally{page.onDestroy();globalThis.setTimeout=oldSet;globalThis.clearTimeout=oldClear;}
 }
});
