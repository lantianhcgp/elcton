import test from 'node:test';
import assert from 'node:assert/strict';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
import receiver from '../entry/src/main/js/MainAbility/common/wearReceiver.js';
import exporter from '../entry/src/main/js/MainAbility/common/wearExporter.js';
import journal from '../entry/src/main/js/MainAbility/common/wearJournal.js';
const text=protocol.snapshot({schema:'elcton.schedule',version:1,settings:{semesterStart:'2026-09-01'},courses:[]});
const storage={load(cb){cb(null,null);},reset(cb){cb(null);},append(seq,s,cb){cb(null);},commit(s,m,cb){cb(null,{text:s,meta:m});}};
const send=(peer,msg)=>new Promise(ok=>peer.receive(typeof msg==='string'?msg:protocol.ascii(msg),ok));
test('receiver rejects unsafe revision integers and numeric digests before staging',async()=>{
 const plan=protocol.plan(text,{transferId:'boundary',datasetId:'school',sourceRevision:1,baseDigest:'',force:false});
 for(const change of [{sourceRevision:9007199254740992},{digest:12345678}]){
  assert.equal((await send(receiver(storage),{...plan[0],...change})).code,'INVALID_BEGIN');
 }
});
test('malformed private JSON never reaches outgoing receiver or exporter error text',async()=>{
 const secret='PRIVATE_COURSE_CONTENT_X2937';const raw='{"'+secret+'" broken';
 for(const peer of [receiver(storage),exporter(cb=>cb(null,null))]){
  const r=await send(peer,raw);assert.equal(r.type,'ERROR');assert.equal(r.code,'INVALID_PACKET');
  assert.ok(!JSON.stringify(r).includes(secret));
 }
});
test('journal parser failures return finite codes rather than exception source text',async()=>{
 const secret='PRIVATE_COURSE_CONTENT_X2937';const io={read(uri,cb){cb(301);},write(uri,s,cb){cb(null);}};
 const r=await new Promise(ok=>journal(io).commit('{"'+secret+'" broken',{},e=>ok(e)));
 assert.equal(r,'INVALID_DOCUMENT');assert.ok(!String(r).includes(secret));
});
