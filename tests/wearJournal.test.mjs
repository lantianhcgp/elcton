import test from 'node:test';
import assert from 'node:assert/strict';
let factory;
try { factory = (await import('../entry/src/main/js/MainAbility/common/wearJournal.js')).default; }
catch (e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; }

function fileIO() {
    const files = new Map();
    const io = {
        read(uri, cb) { queueMicrotask(() => files.has(uri) ? cb(null, files.get(uri)) : cb(301)); },
        write(uri, text, cb) { queueMicrotask(() => { files.set(uri, text); cb(null); }); }
    };
    return {files, io};
}
const call = (fn, ...args) => new Promise((resolve, reject) => fn(...args, (e, v) => e ? reject(new Error(String(e))) : resolve(v)));
const shared = '{"schema":"elcton.schedule","version":1,"settings":{"semesterStart":"2026-09-01"},"courses":[]}';

test('journal publishes only verified data and restores it after a fresh instance', async () => {
    assert.equal(typeof factory, 'function', 'verified two-slot journal is missing');
    const {io} = fileIO();
    const journal = factory(io);
    await call(journal.commit, shared, {datasetId:'school', sourceRevision:1});
    const record = await call(factory(io).load);
    assert.equal(record.text, shared);
    assert.equal(record.meta.sourceRevision, 1);
    assert.equal(record.generation, 1);
});

export {fileIO, call, shared};

test('invalid schema cannot replace the last committed course document', async () => {
    const {io} = fileIO();
    const journal = factory(io);
    await call(journal.commit, shared, {datasetId:'school', sourceRevision:1});
    await assert.rejects(call(journal.commit, shared.replace('"version":1', '"version":2'), {datasetId:'school', sourceRevision:2}), /UNSUPPORTED_SCHEMA/);
    assert.equal((await call(factory(io).load)).text, shared);
});

test('a failed inactive-slot write never changes the last successful baseline', async () => {
    const {io} = fileIO();
    const journal = factory(io);
    await call(journal.commit, shared, {datasetId:'school', sourceRevision:1});
    const original = io.write;
    io.write = (uri, text, cb) => uri.includes('data-b') ? queueMicrotask(() => cb('DISK_FULL')) : original(uri, text, cb);
    await assert.rejects(call(journal.commit, shared, {datasetId:'school', sourceRevision:2}), /DISK_FULL/);
    assert.equal((await call(factory(io).load)).generation, 1);
});

test('cancel before the commit marker leaves the previous generation active',async()=>{
    const {io}=fileIO();const journal=factory(io);
    await call(journal.commit,shared,{datasetId:'school',sourceRevision:1});
    let active=true;const original=io.read;
    io.read=(uri,cb)=>original(uri,(err,text)=>{if(uri.includes('data-b'))active=false;cb(err,text);});
    await assert.rejects(new Promise((resolve,reject)=>journal.commit(shared,{datasetId:'school',sourceRevision:2},(e,r)=>e?reject(Error(e)):resolve(r),()=>active)),/CANCELLED/);
    assert.equal((await call(factory(io).load)).generation,1);
});
