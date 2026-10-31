import test from 'node:test';
import assert from 'node:assert/strict';
import createJournal from '../entry/src/main/js/MainAbility/common/wearJournal.js';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
import {loader,fakeFile} from './loadSource.mjs';
const text='{"schema":"elcton.schedule","version":1,"settings":{"semesterStart":"2026-09-01"},"courses":[]}';
const call=(fn,...a)=>new Promise((ok,no)=>fn(...a,(e,v)=>e?no(Error(String(e))):ok(v)));
function memory(initial){const files=new Map(Object.entries(initial||{}));return {files,read(uri,cb){queueMicrotask(()=>files.has(uri)?cb(null,files.get(uri)):cb(301));},write(uri,s,cb){queueMicrotask(()=>{files.set(uri,s);cb(null);});}};}
test('corrupt journal markers never masquerade as a first launch and reseed',async()=>{
 const file=fakeFile({'internal://app/we-record-a.json':'damaged','internal://app/rawfile/seed-schedule.json':text});
 const store=loader({file:file.api})('common/store.js');
 await assert.rejects(call(store.load),/CORRUPT_JOURNAL/);
 assert.equal(file.files.has('internal://app/we-data-b.json'),false);
});
test('one valid committed slot remains recoverable when the other marker is corrupt',async()=>{
 const io=memory();const journal=createJournal(io);await call(journal.commit,text,{datasetId:'school',sourceRevision:1});
 io.files.set('internal://app/we-record-b.json','damaged');assert.equal((await call(journal.load)).text,text);
});
test('a checksum-valid record with malformed metadata is not accepted or reseeded',async()=>{
 const record={version:1,slot:'a',generation:1,length:text.length,digest:protocol.crc32(text),meta:null};
 const io=memory({'internal://app/we-record-a.json':protocol.ascii({record,digest:protocol.crc32(protocol.ascii(record))}),'internal://app/we-data-a.json':text});
 await assert.rejects(call(createJournal(io).load),/CORRUPT_JOURNAL/);
});
test('legacy replacement carries the loaded generation instead of bypassing CAS',async()=>{
 const file=fakeFile({'internal://app/rawfile/seed-schedule.json':text});const load=loader({file:file.api});const data=load('common/data.js');
 const old=await new Promise(ok=>data.getDoc(ok));const fs=load('common/fs.js');const journal=load('common/wearJournal.js')({read:fs.readFile,write:fs.writeFile,shared:fs.shared});
 await call(journal.commit,text,{datasetId:'new',sourceRevision:2});
 const result=await new Promise(ok=>data.replaceDoc({...old,settings:{semesterStart:'2026-10-01'}},ok));assert.equal(result,false);
 assert.equal((await call(journal.load)).text,text);
});
