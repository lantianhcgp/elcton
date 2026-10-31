import test from 'node:test';
import assert from 'node:assert/strict';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
let create;
try{create=(await import('../entry/src/main/js/MainAbility/common/wearExporter.js')).default;}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const course={id:'c1',name:'测试'.repeat(30),teacher:'',location:'A1',dayOfWeek:6,startPeriod:1,endPeriod:1,startTime:'08:00',endTime:'08:45',weekType:'all',weeks:[],colorIndex:0};
const doc={schema:'elcton.schedule',version:1,rev:3,settings:{semesterStart:'2026-09-01'},courses:[course]};
const message=(type,seq)=>protocol.ascii({protocol:'elcton.sync',version:1,sender:'phone',type,transferId:'e1',seq});
const request=(exporter,type,seq)=>new Promise(resolve=>exporter.receive(message(type,seq),resolve));
test('export publishes only a checksum-verified sequence frozen at request time',async()=>{
 assert.equal(typeof create,'function','reverse export adapter missing');
 const exporter=create(cb=>cb(null,doc));
 const meta=await request(exporter,'EXPORT_REQUEST');
 assert.equal(meta.type,'EXPORT_META');
 let text='';
 for(let seq=0;seq<meta.chunks;seq++){
  const out=await request(exporter,'EXPORT_NEXT',seq);
  assert.equal(out.seq,seq);assert.ok(protocol.ascii(out).length<=1024);text+=out.data;
 }
 assert.equal(text,protocol.snapshot(doc));assert.equal(protocol.crc32(text),meta.digest);
 assert.equal((await request(exporter,'EXPORT_NEXT',0)).data,text.slice(0,300));
});

test('repeated export request with the same id keeps its original frozen snapshot',async()=>{
 let current=doc;const exporter=create(cb=>cb(null,current));
 const first=await request(exporter,'EXPORT_REQUEST');
 current={...doc,courses:[]};
 const repeated=await request(exporter,'EXPORT_REQUEST');
 assert.deepEqual(repeated,first);
});
