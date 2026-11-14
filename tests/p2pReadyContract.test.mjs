import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as flush} from 'node:timers/promises';
import {loader,fakeFile} from './loadSource.mjs';

function applicationLoader(system) {
  const app={};const load=loader({...system,app});
  app.$def=load('app.js');
  return load;
}
const identity={phonePackage:'com.hcbiu.elcton',phoneFingerprint:'a'.repeat(64)};
const hello=JSON.stringify({protocol:'elcton.sync',version:1,sender:'phone',type:'HELLO',transferId:'new-hello'});
// Callback fixtures model the published SDK contract, not Bluetooth or a physical service.
function native(version='5.0.0.401') {
  const calls=[];let inbox,versionCallback;
  const engine={
    getWearEngineVersion(p){calls.push(['version',p.sdkVersion]);versionCallback=p.complete;},
    setPackageName(p){calls.push(['package',p.appName]);p.complete();},
    setFingerprint(p){calls.push(['fingerprint',p.appCert]);p.complete();},
    unsubscribeMsg(){calls.push(['unsubscribe']);},
    subscribeMsg(p){calls.push(['subscribe']);inbox=p;p.success({isRegister:true});},
    sendMsg(p){calls.push(['send',JSON.parse(p.message).type]);p.success();}
  };
  return {engine,calls,version(){if(versionCallback)versionCallback(version);},get inbox(){return inbox;}};
}

test('versioned SDK negotiation precedes identity and subscription; no send before native registration',()=>{
  const h=native();const create=applicationLoader({wearengine:h.engine})('common/wearChannel.js');
  const received=[];let completed=0;
  const c=create(identity);c.open(raw=>received.push(raw),err=>{assert.equal(err,null);completed++;});
  assert.deepEqual(h.calls,[['version','3']],'must negotiate sdkVersion=3 instead of guessing a native bus');
  assert.equal(completed,0);
  h.version();assert.equal(completed,1);
  assert.deepEqual(h.calls.map(x=>x[0]),['version','package','fingerprint','unsubscribe','subscribe']);
  h.inbox.success({isRegister:false,message:hello});assert.deepEqual(received,[hello]);
  c.send({protocol:'elcton.sync',version:1,sender:'watch',type:'READY',transferId:'new-hello'},err=>assert.equal(err,null));
  assert.equal(h.calls.at(-1)[0],'send');
  c.close();assert.equal(h.calls.at(-1)[0],'unsubscribe');
});

test('closing while version callback is pending prevents later native registration',()=>{
  const h=native();const create=applicationLoader({wearengine:h.engine})('common/wearChannel.js');
  const c=create(identity);let completed=0;
  c.open(()=>{},()=>completed++);c.close();const before=JSON.stringify(h.calls);
  h.version();assert.equal(completed,0);assert.equal(JSON.stringify(h.calls),before);
});

test('service 303 uses published FeatureAbility messaging rather than calling modern native methods',()=>{
  const h=native('3.0.0.303');let inbox;
  const old=globalThis.FeatureAbility;globalThis.FeatureAbility={
    subscribeMsg(p){h.calls.push(['legacy-subscribe']);inbox=p;p.success({isRegister:true});},
    sendMsg(p){h.calls.push(['legacy-send']);p.success();},
    unsubscribeMsg(){h.calls.push(['legacy-unsubscribe']);}
  };
  try {
    const create=applicationLoader({wearengine:h.engine})('common/wearChannel.js');const c=create(identity);
    const got=[];c.open(x=>got.push(x),e=>assert.equal(e,null));h.version();
    assert.equal(h.calls.some(x=>x[0]==='subscribe'),false);
    assert.equal(h.calls.at(-1)[0],'legacy-subscribe');inbox.success({message:hello});assert.deepEqual(got,[hello]);
    c.send({sender:'watch',type:'READY'},e=>assert.equal(e,null));assert.equal(h.calls.at(-1)[0],'legacy-send');
    c.close();assert.equal(h.calls.at(-1)[0],'legacy-unsubscribe');
  } finally {if(old===undefined)delete globalThis.FeatureAbility;else globalThis.FeatureAbility=old;}
});

test('bad or too-old queried version fails explicitly and never guesses a modern bus',()=>{
  for(const value of ['',null,'garbage','3.0.0.301']) {
    const h=native(value);const create=applicationLoader({wearengine:h.engine})('common/wearChannel.js');
    const c=create(identity);let error;c.open(()=>{},e=>error=e);h.version();
    assert.ok(error,'unsupported native service must not look registered');
    assert.equal(h.calls.some(x=>x[0]==='subscribe'),false);c.close();
  }
});

function pageHarness({failReady=false}={}) {
  const h=native();const originalSet=globalThis.setTimeout,originalClear=globalThis.clearTimeout;
  const timers=new Map();let next=0;
  globalThis.setTimeout=(cb,ms)=>{const id=next++;timers.set(id,{cb,ms});return id;};
  globalThis.clearTimeout=id=>timers.delete(id);
  if(failReady)h.engine.sendMsg=p=>{h.calls.push(['send',JSON.parse(p.message).type]);p.fail('communication failure',206);};
  const empty={schema:'elcton.schedule',version:1,rev:1,settings:{semesterStart:'2026-09-01'},courses:[]};
  const file=fakeFile({'internal://app/schedule.json':JSON.stringify(empty)});
  const spec=applicationLoader({file:file.api,wearengine:h.engine,device:{getInfo:p=>p.success({windowWidth:412,windowHeight:484,screenShape:'rect'})},router:{replace(){}}})('pages/phone-sync/phone-sync.js');
  const page={...spec,...spec.data};delete page.data;page.onInit();
  return {h,page,timers,restore(){try{page.onDestroy();}finally{globalThis.setTimeout=originalSet;globalThis.clearTimeout=originalClear;}}};
}

test('a negotiated and registered idle listener stays armed after 30s; a fresh HELLO still receives READY',async()=>{
  const x=pageHarness();
  try {
    x.page.onListen();x.h.version();await flush();
    // Model native removal of the active timer before invoking its retained callback.
    const active=x.page._timer;const timer=x.timers.get(active);x.timers.delete(active);timer.cb();await flush();
    assert.equal(x.page.listening,true,'idle wait must not unregister an initialized listener');
    const before=x.h.calls.filter(c=>c[0]==='send').length;
    x.h.inbox.success({message:hello});await flush();
    assert.ok(x.h.calls.filter(c=>c[0]==='send').length>before);assert.equal(x.h.calls.at(-1)[1],'READY');
    x.page.onHide();assert.equal(x.page.listening,false);assert.equal(x.timers.size,0);
  } finally {x.restore();}
});

test('proactive READY failure is visible with the native send code instead of being swallowed',async()=>{
  const x=pageHarness({failReady:true});
  try {
    x.page.onListen();x.h.version();await flush();
    assert.match(x.page.detail,/SEND_206/,'show bounded native evidence for the failed proactive reply');
    assert.equal(x.page.listening,true,'send failure is not a receiver-unregistration result');
  } finally {x.restore();}
});
