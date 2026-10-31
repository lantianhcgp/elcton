import test from 'node:test';
import assert from 'node:assert/strict';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
let makeReceiver;
try { makeReceiver = (await import('../entry/src/main/js/MainAbility/common/wearReceiver.js')).default; }
catch(e) { if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e; }
const doc = {schema:'elcton.schedule',version:1,settings:{semesterStart:'2026-09-01'},courses:[]};
const wire = protocol.snapshot(doc);
const messages = protocol.plan(wire,{transferId:'t-one',datasetId:'school',sourceRevision:1,baseDigest:'',force:false});
const send = (receiver, message) => new Promise(resolve => receiver.receive(protocol.ascii(message),resolve));
function storage() {
    let saved = null;
    return { get current(){return saved;}, load(cb){cb(null,saved);},
        append(seq,data,cb){cb(null);}, reset(cb){cb(null);},
        commit(text,meta,cb){saved={text,meta,generation:1};cb(null,saved);} };
}

test('receiver waits for committed readback before APPLIED and does not trust send success', async () => {
    assert.equal(typeof makeReceiver,'function','transaction receiver is missing');
    const store=storage();
    const receiver=makeReceiver(store,{maxBytes:8192});
    for(const message of messages.slice(0,-1)){
        const response=await send(receiver,message);
        assert.equal(response.type,'ACK');
        assert.equal(store.current,null);
    }
    const response=await send(receiver,messages.at(-1));
    assert.equal(response.type,'APPLIED');
    assert.equal(response.digest,protocol.crc32(wire));
    assert.equal(store.current.text,wire);
});

export {send,storage,doc,wire,messages};

test('duplicate chunks are idempotent and outbound watch messages cannot fake peer responses', async () => {
    const store=storage();const receiver=makeReceiver(store,{maxBytes:8192});
    await send(receiver,messages[0]);
    const chunks=messages.filter(m=>m.type==='CHUNK');
    await send(receiver,chunks[0]);
    assert.equal((await send(receiver,chunks[0])).type,'ACK');
    assert.equal((await send(receiver,{...chunks[0],sender:'watch'})).type,'ERROR');
    for(const chunk of chunks.slice(1)) await send(receiver,chunk);
    assert.equal((await send(receiver,messages.at(-1))).type,'APPLIED');
    assert.equal((await send(receiver,messages.at(-1))).type,'APPLIED');
});

test('saving failure and missing chunks preserve the existing baseline', async () => {
    const store=storage();store.commit=(text,meta,cb)=>cb('DISK_FULL');
    const receiver=makeReceiver(store,{maxBytes:8192});
    await send(receiver,messages[0]);
    assert.equal((await send(receiver,messages.at(-1))).code,'INCOMPLETE_OR_CORRUPT');
    for(const msg of messages.slice(0,-1)) await send(receiver,msg);
    assert.equal((await send(receiver,messages.at(-1))).code,'DISK_FULL');
    assert.equal(store.current,null);
});

test('receiver rejects an old source revision even when its baseline digest matches', async () => {
    const store=storage();
    store.load=cb=>cb(null,{text:wire,meta:{datasetId:'school',sourceRevision:7,appliedDigest:protocol.crc32(wire),localDirty:false}});
    const receiver=makeReceiver(store,{maxBytes:8192});
    const old={...messages[0],sourceRevision:1,baseDigest:protocol.crc32(wire)};
    assert.equal((await send(receiver,old)).code,'STALE_REVISION');
});

test('cancel during append discards the late callback and allows a new transaction',async()=>{
    const store=storage();let append;
    store.append=(seq,data,cb)=>{append=cb;};
    const receiver=makeReceiver(store,{maxBytes:8192});
    await send(receiver,messages[0]);
    const pending=send(receiver,messages[1]);receiver.cancel();append(null);
    assert.equal((await pending).code,'CANCELLED');
    assert.equal(receiver.isBusy(),false);
    assert.equal(store.current,null);
    assert.equal((await send(receiver,{...messages[0],transferId:'t-next'})).type,'ACK');
});
