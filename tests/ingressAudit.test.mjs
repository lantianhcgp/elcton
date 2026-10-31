import nodeTest from 'node:test';
const test=(name,run)=>nodeTest(name,{timeout:1500},run);
import assert from 'node:assert/strict';
import {setImmediate as flush} from 'node:timers/promises';
import {loader,fakeFile} from './loadSource.mjs';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
import receiver from '../entry/src/main/js/MainAbility/common/wearReceiver.js';
import exporter from '../entry/src/main/js/MainAbility/common/wearExporter.js';
const doc={schema:'elcton.schedule',version:1,rev:1,settings:{semesterStart:'2026-09-01'},courses:[]};
const receive=(r,m)=>new Promise(cb=>r.receive(protocol.ascii(m),cb));
const packet=(type,id)=>({protocol:'elcton.sync',version:1,sender:'phone',type,transferId:id});
const get=(fn,...args)=>new Promise(cb=>fn(...args,(err,value)=>cb({err,value})));

test('calendar ingress rejects impossible days and accepts Gregorian leap dates',()=>{
 for(const date of ['2026-02-30','2026-13-01','2026-00-10','2025-02-29','0000-01-01'])assert.throws(()=>protocol.snapshot({...doc,settings:{semesterStart:date}}),/INVALID_DATE/);
 assert.doesNotThrow(()=>protocol.snapshot({...doc,settings:{semesterStart:'2024-02-29'}}));
});
test('receiver and exporter reject numeric transaction identifiers',async()=>{
 const store={load(cb){cb(null,null);},reset(cb){cb(null);},append(s,t,cb){cb(null);},commit(t,m,cb){cb(null,{text:t,meta:m});}};
 const r=receiver(store);assert.equal((await receive(r,packet('CANCEL',123))).code,'INVALID_TRANSFER_ID');
 const e=exporter(cb=>cb(null,doc));assert.equal((await receive(e,packet('EXPORT_REQUEST',123))).type,'ERROR');
});
test('concurrent control queries share at most one bounded storage read',async()=>{
 let callback;let reads=0;const r=receiver({load(cb){reads++;callback=cb;}});
 const requests=Array.from({length:12},()=>receive(r,packet('HELLO','')));
 assert.equal(reads,1);callback(null,null);
 const replies=await Promise.all(requests);assert.equal(replies.filter(x=>x.type==='READY').length,4);
 assert.equal(replies.filter(x=>x.code==='RETRY_LIMIT').length,8);
});
test('synchronous get exception is not interpreted as an absent legacy file',async()=>{
 const f=fakeFile({'internal://app/schedule.json':JSON.stringify(doc)});f.api.get=()=>{throw Error('platform unavailable');};
 const api=loader({file:f.api})('common/data.js');const settings=await new Promise(cb=>api.loadSettings(cb));
 assert.ok(settings.__loadError);assert.equal(await new Promise(cb=>api.saveCourses([],cb)),false);
 assert.equal(f.files.get('internal://app/schedule.json'),JSON.stringify(doc));
});
test('damaged legacy data is preserved without silently reseeding',async()=>{
 const raw='{broken';const f=fakeFile({'internal://app/schedule.json':raw});const api=loader({file:f.api})('common/data.js');
 const settings=await new Promise(cb=>api.loadSettings(cb));assert.ok(settings.__loadError);
 assert.equal(f.files.get('internal://app/schedule.json'),raw);
});
test('missing legacy courses is an error, not an intentional empty schedule',()=>{
 const f=fakeFile();const store=loader({file:f.api})('common/store.js');
 const bad={...doc};delete bad.courses;assert.equal(store.parseDoc(JSON.stringify(bad)),null);
});
test('failed first seed persistence cannot be exposed as a successful load',async()=>{
 const f=fakeFile({'internal://app/rawfile/seed-schedule.json':JSON.stringify(doc)});
 f.api.writeText=({fail})=>queueMicrotask(()=>fail('no space',300));
 const api=loader({file:f.api})('common/data.js');const settings=await new Promise(cb=>api.loadSettings(cb));assert.ok(settings.__loadError);
});
test('cached local document cannot overwrite a newer committed generation',async()=>{
 const f=fakeFile({'internal://app/schedule.json':JSON.stringify(doc)});const app={};
 const one=loader({file:f.api,app})('common/data.js');const before=await new Promise(cb=>one.getDoc(cb));
 const two=loader({file:f.api,app})('common/data.js');await new Promise(cb=>two.getDoc(cb));
 assert.equal(await new Promise(cb=>two.saveSettings({...doc.settings,semesterStart:'2026-09-07'},cb)),true);
 assert.equal(await new Promise(cb=>one.saveCourses([],cb)),false);
 const current=await new Promise(cb=>loader({file:f.api,app})('common/data.js').getDoc(cb));
 assert.equal(current.settings.semesterStart,'2026-09-07');assert.notEqual(current.rev,before.rev);
});
test('read metadata and delayed IO queue bounds are enforced',async()=>{
 const app={};const f=fakeFile();f.api.get=({success})=>success({length:Infinity});
 const api=loader({file:f.api,app})('common/fs.js');assert.equal((await get(api.readFile,'internal://app/x')).err,'READ_LIMIT');
 let pending;f.api.get=({success})=>{pending=success;};const requests=Array.from({length:30},()=>get(api.readFile,'internal://app/x'));
 assert.ok(app._elctonIO.queue.length<=12);pending({length:0});
 while(app._elctonIO.busy)pending({length:0});
 const results=await Promise.all(requests);assert.ok(results.some(r=>r.err==='IO_BUSY'));
});
