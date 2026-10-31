import nodeTest from 'node:test';
const test=(name,run)=>nodeTest(name,{timeout:1500},run);
import assert from 'node:assert/strict';
import {setImmediate as flush} from 'node:timers/promises';
import {loader,fakeFile} from './loadSource.mjs';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
const doc={schema:'elcton.schedule',version:1,settings:{semesterStart:'2026-09-01'},courses:[]};
function pageHarness(){
 const file=fakeFile({'internal://app/schedule.json':JSON.stringify(doc)});
 const messages=[];let incoming;
 const engine={setPackageName(p){p.complete();},setFingerprint(p){p.complete();},subscribeMsg(p){incoming=p.success;p.success({isRegister:true});},unsubscribeMsg(){},sendMsg(p){messages.push(JSON.parse(p.message));p.success();}};
 const source=loader({file:file.api,wearengine:engine,device:{getInfo(p){p.success({windowWidth:412,windowHeight:484,screenShape:'rect'});}},router:{replace(){}}})('pages/phone-sync/phone-sync.js');
 const page={...source,...source.data};delete page.data;page.onInit();page.onListen();
 return {page,file,messages,engine,deliver(m){incoming({isRegister:false,message:protocol.ascii(m)});}};
}
test('local cancel in commit phase cannot claim the old schedule was preserved',async()=>{
 const h=pageHarness();await flush();
 try {
  h.page._receiver.cancel=()=>false;h.page.phase='saving';h.page.onListen();
  assert.equal(h.page.phase,'saving');assert.equal(h.page.listening,true);
  assert.ok(h.page.status.includes('提交'));assert.ok(!h.page.detail.includes('已保留'));
 } finally {if(h.page._receiver)h.page._receiver.cancel=()=>true;h.page.onDestroy();}
});
test('watchdog during issued marker reports uncertain result rather than old data preserved',async()=>{
 const h=pageHarness();await flush();
 const timers=[];const original=globalThis.setTimeout;globalThis.setTimeout=(f)=>{timers.push(f);return timers.length;};
 try{h.page._receiver.cancel=()=>false;h.page.phase='saving';h.page.watchDog();timers.at(-1)();
 assert.ok(h.page.detail.includes('重连'));assert.ok(!h.page.detail.includes('已保留'));
 }finally{globalThis.setTimeout=original;if(h.page._receiver)h.page._receiver.cancel=()=>true;h.page.onDestroy();}
});
test('commit-unknown stays uncertain through local cancel and watchdog until verified READY',async()=>{
 const h=pageHarness();await flush();
 try{
  h.page._receiver.receive=(raw,cb)=>cb({protocol:'elcton.sync',version:1,sender:'watch',type:'ERROR',transferId:'unknown',code:'COMMIT_UNKNOWN'});
  h.deliver({protocol:'elcton.sync',version:1,sender:'phone',type:'END',transferId:'unknown'});
  assert.ok(h.page.detail.includes('重连'),'Unknown commit must immediately ask to verify');
  h.page._receiver.receive=(raw,cb)=>cb({protocol:'elcton.sync',version:1,sender:'watch',type:'CANCELLED',transferId:'unknown'});
  h.deliver({protocol:'elcton.sync',version:1,sender:'phone',type:'CANCEL',transferId:'unknown'});
  assert.ok(!h.page.detail.includes('已保留'),'Wire CANCEL after unknown commit must not imply rollback');
  h.page.onListen();assert.ok(!h.page.detail.includes('已保留'),'Cancel after unknown commit must not imply rollback');
  h.page.onListen();await flush();
  h.page._receiver.receive=(raw,cb)=>cb({protocol:'elcton.sync',version:1,sender:'watch',type:'READY',transferId:'',maxBytes:8192});
  h.deliver({protocol:'elcton.sync',version:1,sender:'phone',type:'HELLO',transferId:''});
  h.page.onListen();assert.ok(h.page.detail.includes('已保留'),'A successful read resolves uncertainty');
 }finally{h.page.onDestroy();}
});
test('data load saturation returns bounded empty results without poisoning a successful read',async()=>{
 const file=fakeFile({'internal://app/schedule.json':JSON.stringify(doc)});const original=file.api.get;let resume;
 file.api.get=p=>{resume=()=>original(p);};
 const api=loader({file:file.api})('common/data.js');const results=[];
 for(let i=0;i<14;i++)api.getCoursesForDay(1,1,c=>results.push(c));
 assert.equal(results.length,2);assert.ok(results.every(Array.isArray));
 file.api.get=original;resume();await flush();await flush();await flush();
 assert.equal(results.length,14);assert.ok(results.every(Array.isArray));
 const saved=await new Promise(cb=>api.saveSettings({...doc.settings,semesterStart:'2026-10-01'},cb));
 assert.equal(saved,true,'Overflow must not set a persistent load error');
 api.clearCache();
});
test('old channel send callbacks cannot reach a reopened listener',()=>{
 const sends=[];let messages;
 const engine={setPackageName(p){p.complete();},setFingerprint(p){p.complete();},subscribeMsg(p){messages=p.success;p.success({isRegister:true});},unsubscribeMsg(){},sendMsg(p){sends.push(p);}};
 const channel=loader({wearengine:engine})('common/wearChannel.js')({phonePackage:'com.hcbiu.elcton',phoneFingerprint:'a'.repeat(64)});
 let calls=0;channel.open(()=>{},()=>{});channel.send({sender:'watch',type:'ACK'},()=>calls++);channel.close();channel.open(()=>{},()=>{});
 sends[0].fail(null,300);assert.equal(calls,0);channel.close();
});
test('an old cached local read that finishes after a write cannot become the next mutation baseline',async()=>{
 const file=fakeFile({'internal://app/schedule.json':JSON.stringify(doc)});const app={};
 const api=loader({file:file.api,app})('common/data.js');await new Promise(cb=>api.getDoc(cb));
 let end;const original=file.api.writeText;
 file.api.writeText=p=>{end=()=>original(p);};
 const save=new Promise(cb=>api.saveSettings({...doc.settings,semesterStart:'2026-09-07'},cb));await flush();
 const cached=await new Promise(cb=>api.getDoc(cb));assert.ok(cached.__generation);
 file.api.writeText=original;end();assert.equal(await save,true);
 assert.equal((await new Promise(cb=>api.getDoc(cb))).settings.semesterStart,'2026-09-07');
});
