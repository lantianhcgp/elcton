import test from 'node:test';
import assert from 'node:assert/strict';
import {loader,fakeFile} from './loadSource.mjs';

// An SDK callback can be deferred: the try around registration is already gone.
test('deferred native identity continuation fails explicitly and cleans the page if fingerprint is absent or throws',()=>{
 for(const mode of ['absent','throw']){
  const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
  const timers=new Map();let sequence=0,version,packageComplete,subscriptions=0;
  globalThis.setTimeout=(callback,ms)=>{const id=sequence++;timers.set(id,{callback,ms});return id;};
  globalThis.clearTimeout=id=>timers.delete(id);
  const engine={getWearEngineVersion:p=>version=p.complete,setPackageName:p=>packageComplete=p.complete,unsubscribeMsg(){},subscribeMsg(){subscriptions++;},sendMsg(){}};
  if(mode==='throw')engine.setFingerprint=()=>{throw new Error('native configuration unavailable');};
  const app={};const load=loader({app,wearengine:engine,file:fakeFile().api,device:{getInfo:p=>p.success({windowWidth:412,windowHeight:484,screenShape:'rect'})},router:{replace(){}}});app.$def=load('app.js');
  const spec=load('pages/phone-sync/phone-sync.js');const page={...spec,...spec.data};delete page.data;
  try{
   page.onInit();page.onListen();version('5.0.0.401');
   assert.equal(page.phase,'opening');assert.equal(page.listening,true);
   assert.doesNotThrow(()=>packageComplete(),mode);
   assert.equal(page.phase,'error');assert.equal(page.listening,false);
   assert.match(page.detail,/CONFIG_UNAVAILABLE/);assert.equal(timers.size,0);
   assert.equal(subscriptions,0);assert.doesNotThrow(()=>packageComplete());assert.equal(subscriptions,0);
  }finally{page.onDestroy();globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}
 }
});
