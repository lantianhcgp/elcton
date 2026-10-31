import nodeTest from 'node:test';
const test = (name, run) => nodeTest(name, {timeout:1000}, run);
import assert from 'node:assert/strict';
import {setImmediate as flush} from 'node:timers/promises';
import {loader,fakeFile} from './loadSource.mjs';
import createReceiver from '../entry/src/main/js/MainAbility/common/wearReceiver.js';
import createJournal from '../entry/src/main/js/MainAbility/common/wearJournal.js';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';

const empty={schema:'elcton.schedule',version:1,settings:{semesterStart:'2026-09-01'},courses:[]};
const text=protocol.snapshot(empty);
const plan=id=>protocol.plan(text,{transferId:id,datasetId:'school',sourceRevision:1,baseDigest:'',force:true});
const call=(fn,...args)=>new Promise((resolve,reject)=>fn(...args,(e,r)=>e?reject(Error(String(e))):resolve(r)));
const receive=(r,m)=>new Promise(done=>r.receive(protocol.ascii(m),done));
function io(){
 const files=new Map();return {files,shared:{},read(uri,cb){queueMicrotask(()=>files.has(uri)?cb(null,files.get(uri)):cb(301));},
 write(uri,value,cb){queueMicrotask(()=>{files.set(uri,value);cb(null);});}};
}

test('journal checks expected generation under its shared commit lock',async()=>{
 const file=io();const journal=createJournal(file);
 await call(journal.commit,text,{datasetId:'school',sourceRevision:1});
 await call(journal.commit,text,{datasetId:'school',sourceRevision:2});
 const error=await new Promise(resolve=>journal.commit(text,{datasetId:'school',sourceRevision:3},e=>resolve(e),null,1));
 assert.equal(error,'CONFLICT');assert.equal((await call(journal.load)).generation,2);
});

test('separate journal instances cannot write the same inactive slot concurrently',async()=>{
 const file=io();const first=createJournal(file),second=createJournal(file);
 let continueWrite;const original=file.write;let issued=0;
 file.write=(uri,value,cb)=>{if(++issued===1)continueWrite=()=>original(uri,value,cb);else original(uri,value,cb);};
 const writing=call(first.commit,text,{datasetId:'school',sourceRevision:1});await flush();
 const rejected=await new Promise(resolve=>second.commit(text,{datasetId:'school',sourceRevision:2},e=>resolve(e)));
 file.write=original;continueWrite();await writing;
 assert.equal(rejected,'BUSY');
 assert.equal((await call(second.load)).generation,1);
});

test('CANCEL after marker issuance reports commit in progress, not old data preserved',async()=>{
 const file=io();const journal=createJournal(file);let releaseMarker;
 const original=file.write;
 file.write=(uri,value,cb)=>uri.includes('record-')?(releaseMarker=()=>original(uri,value,cb)):original(uri,value,cb);
 const receiver=createReceiver({load:journal.load,reset(cb){cb(null);},append(seq,value,cb){cb(null);},
  commit(value,meta,cb,current,expected,onMarker){journal.commit(value,meta,cb,current,expected,onMarker);}});
 const messages=plan('critical');for(const m of messages.slice(0,-1))await receive(receiver,m);
 const committing=receive(receiver,messages.at(-1));await flush();assert.equal(typeof releaseMarker,'function');
 const cancellation=await receive(receiver,{protocol:'elcton.sync',version:1,sender:'phone',type:'CANCEL',transferId:'critical'});
 assert.equal(cancellation.code,'COMMIT_IN_PROGRESS');releaseMarker();
 assert.equal((await committing).type,'APPLIED');assert.equal((await call(journal.load)).text,text);
});

test('a failed readback after issued marker is uncertain, not guaranteed old baseline',async()=>{
 const file=io();const journal=createJournal(file);let marked=false;
 const write=file.write;file.write=(uri,value,cb)=>{if(uri.includes('record-'))marked=true;write(uri,value,cb);};
 const read=file.read;file.read=(uri,cb)=>marked&&uri.includes('record-')?cb('READ_FAILED'):read(uri,cb);
 const error=await new Promise(resolve=>journal.commit(text,{datasetId:'school',sourceRevision:1},e=>resolve(e)));
 assert.equal(error,'COMMIT_UNKNOWN');file.read=read;
 assert.equal((await call(createJournal(file).load)).text,text);
});

test('app-scoped IO serializes writes even across separately loaded page bundles',async()=>{
        var file=fakeFile();const app={};const writes=[];
        file.api.writeText=params=>writes.push(params);
        const one=loader({file:file.api,app})('common/fs.js');const two=loader({file:file.api,app})('common/fs.js');
        const first=call(one.writeFile,'internal://app/stage','old');const second=call(two.writeFile,'internal://app/stage','');
        assert.equal(writes.length,1);file.files.set(writes[0].uri,writes[0].text);writes[0].success();await first;
        assert.equal(writes.length,2);file.files.set(writes[1].uri,writes[1].text);writes[1].success();await second;
});
