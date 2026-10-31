import nodeTest from 'node:test';
const test = (name, run) => nodeTest(name, {timeout:1000}, run);
import assert from 'node:assert/strict';
import {setImmediate as flush} from 'node:timers/promises';
import {loader, fakeFile} from './loadSource.mjs';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
import createExporter from '../entry/src/main/js/MainAbility/common/wearExporter.js';
import createReceiver from '../entry/src/main/js/MainAbility/common/wearReceiver.js';

const doc = {schema:'elcton.schedule', version:1, rev:1,
    settings:{semesterStart:'2026-09-01', vibrationEnabled:false, reminderMinutes:5}, courses:[]};
const wire = protocol.snapshot(doc);
const plan = id => protocol.plan(wire, {transferId:id, datasetId:'school', sourceRevision:1, baseDigest:'', force:true});
const packet = (type, id, extra={}) => ({protocol:'elcton.sync',version:1,sender:'phone',type,transferId:id,...extra});
const receive = (target, message) => new Promise(resolve => target.receive(protocol.ascii(message), resolve));
function immediateStore() {
    return {load(cb){cb(null,null);}, reset(cb){cb(null);}, append(seq,text,cb){cb(null);},
        commit(text,meta,cb){cb(null,{text,meta,generation:1});}};
}
async function pageHarness(run) {
    const file = fakeFile({'internal://app/schedule.json':JSON.stringify(doc)});
    const outbound=[]; let incoming;
    const engine={setPackageName(p){p.complete();},setFingerprint(p){p.complete();},
        subscribeMsg(p){incoming=p.success;p.success({isRegister:true});},unsubscribeMsg(){},
        sendMsg(p){outbound.push(JSON.parse(p.message));p.success();}};
    const spec=loader({file:file.api,wearengine:engine,
        device:{getInfo(p){p.success({windowWidth:412,windowHeight:484,screenShape:'rect'});}},
        router:{replace(){}}})('pages/phone-sync/phone-sync.js');
    const page={...spec,...spec.data};delete page.data;
    async function deliver(message) {
        const start=outbound.length;
        incoming({isRegister:false,isFileType:false,message:protocol.ascii(message)});
        await flush();
        return outbound.slice(start);
    }
    try {
        page.onInit.call(page);page.onListen.call(page);await flush();
        assert.equal(page.phase,'ready');
        await run({page,deliver,outbound,file});
    } finally {page.onDestroy.call(page);}
}

test('page answers HELLO and STATUS during a frozen export instead of swallowing controls', async()=>{
    await pageHarness(async({deliver})=>{
        assert.equal((await deliver(packet('EXPORT_REQUEST','export-a')))[0].type,'EXPORT_META');
        assert.equal((await deliver(packet('HELLO','')))[0]?.type,'READY');
        assert.equal((await deliver(packet('STATUS','query-a')))[0]?.type,'READY');
    });
});

test('page routes matching CANCEL to exporter and immediately permits a new receive', async()=>{
    await pageHarness(async({page,deliver})=>{
        await deliver(packet('EXPORT_REQUEST','export-a'));
        assert.equal((await deliver(packet('CANCEL','export-a')))[0]?.type,'EXPORT_CLOSED');
        assert.equal(page._exporter.isActive(),false);
        assert.equal(page.phase,'ready');
        assert.equal((await deliver(plan('incoming-a')[0]))[0]?.type,'ACK');
    });
});

test('page explicitly reports BUSY on an overlapping BEGIN and does not switch export UI', async()=>{
    await pageHarness(async({page,deliver})=>{
        await deliver(packet('EXPORT_REQUEST','export-a'));
        const result=await deliver(plan('incoming-a')[0]);
        assert.equal(result[0]?.code,'BUSY');
        assert.notEqual(page.phase,'receiving');
        assert.equal(page._exporter.isActive(),true);
    });
});

test('same-id retry while exporter load is pending shares one frozen read without CANCELLED',async()=>{
    let load;let calls=0;
    const exporter=createExporter(cb=>{load=cb;calls++;});
    const first=receive(exporter,packet('EXPORT_REQUEST','export-a'));
    const repeated=receive(exporter,packet('EXPORT_REQUEST','export-a'));
    assert.equal(exporter.isActive(),true);
    assert.equal(calls,1);
    load(null,doc);
    const replies=await Promise.all([first,repeated]);
    assert.equal(replies[0].type,'EXPORT_META');assert.deepEqual(replies[0],replies[1]);
});

test('different export id and unrelated cancel cannot replace an in-flight export',async()=>{
    let load;const exporter=createExporter(cb=>{load=cb;});
    const first=receive(exporter,packet('EXPORT_REQUEST','export-a'));
    assert.equal((await receive(exporter,packet('EXPORT_REQUEST','export-b'))).code,'BUSY');
    assert.equal((await receive(exporter,packet('CANCEL','export-b'))).code,'NO_EXPORT');
    load(null,doc);assert.equal((await first).type,'EXPORT_META');
});

test('cancelled export load cannot revive or invalidate a later export',async()=>{
    const loads=[];const exporter=createExporter(cb=>loads.push(cb));
    const old=receive(exporter,packet('EXPORT_REQUEST','export-a'));
    assert.equal((await receive(exporter,packet('CANCEL','export-a'))).type,'EXPORT_CLOSED');
    const next=receive(exporter,packet('EXPORT_REQUEST','export-b'));
    loads[0](null,doc);loads[1](null,doc);
    assert.equal((await old).code,'CANCELLED');
    assert.equal((await next).type,'EXPORT_META');assert.equal(exporter.isActive(),true);
});

test('wire CANCEL during BEGIN load prevents the late callback from resetting or opening a transaction',async()=>{
    let load;let resets=0;const store=immediateStore();
    store.load=cb=>{load=cb;};store.reset=cb=>{resets++;cb(null);};
    const receiver=createReceiver(store);
    const begin=receive(receiver,plan('incoming-a')[0]);
    assert.equal((await receive(receiver,packet('CANCEL','incoming-a'))).type,'CANCELLED');
    load(null,null);
    assert.equal((await begin).code,'CANCELLED');assert.equal(resets,0);
    assert.equal(receiver.isBusy(),false);
});

test('cancel while physical reset is pending serializes a new BEGIN until the old IO drains',async()=>{
    const resets=[];const store=immediateStore();store.reset=cb=>resets.push(cb);
    const receiver=createReceiver(store);
    const old=receive(receiver,plan('incoming-a')[0]);
    assert.equal((await receive(receiver,packet('CANCEL','incoming-a'))).type,'CANCELLED');
    assert.equal((await receive(receiver,plan('incoming-b')[0])).code,'BUSY');
    assert.equal(resets.length,1);
    resets[0](null);assert.equal((await old).code,'CANCELLED');
    const next=receive(receiver,plan('incoming-b')[0]);resets[1](null);
    assert.equal((await next).type,'ACK');
});

test('wire CANCEL during append preserves committed data and isolates the next transaction',async()=>{
    const appends=[];const store=immediateStore();store.append=(seq,text,cb)=>appends.push(cb);
    const receiver=createReceiver(store);const first=plan('incoming-a');
    await receive(receiver,first[0]);const pending=receive(receiver,first[1]);
    assert.equal((await receive(receiver,packet('CANCEL','incoming-a'))).type,'CANCELLED');
    assert.equal((await receive(receiver,plan('incoming-b')[0])).code,'BUSY');
    appends[0](null);assert.equal((await pending).code,'CANCELLED');
    assert.equal((await receive(receiver,plan('incoming-b')[0])).type,'ACK');
});

test('late cancelled commit cannot report APPLIED and isCurrent becomes false',async()=>{
    let complete;let current;const store=immediateStore();
    store.commit=(text,meta,cb,isCurrent)=>{complete=cb;current=isCurrent;};
    const receiver=createReceiver(store);const messages=plan('incoming-a');
    for(const message of messages.slice(0,-1))await receive(receiver,message);
    const committing=receive(receiver,messages.at(-1));
    assert.equal((await receive(receiver,packet('CANCEL','incoming-a'))).type,'CANCELLED');
    assert.equal(typeof current,'function');assert.equal(current(),false);
    complete(null,{text:wire,meta:{},generation:1});
    assert.equal((await committing).code,'CANCELLED');assert.equal(receiver.isBusy(),false);
});

test('in-flight BEGIN retry waits for the same persisted acknowledgement without a BUSY error',async()=>{
    let reset;const store=immediateStore();store.reset=cb=>{reset=cb;};
    const receiver=createReceiver(store);const message=plan('incoming-a')[0];
    const first=receive(receiver,message);const repeated=receive(receiver,message);
    reset(null);const replies=await Promise.all([first,repeated]);
    assert.equal(replies[0].type,'ACK');assert.deepEqual(replies[0],replies[1]);
});
