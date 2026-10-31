import test from 'node:test';
import assert from 'node:assert/strict';
import {loader,fakeFile} from './loadSource.mjs';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
import makeJournal from '../entry/src/main/js/MainAbility/common/wearJournal.js';

const empty={schema:'elcton.schedule',version:1,settings:{semesterStart:'2026-09-07'},courses:[]};
test('existing course pages read the committed mobile snapshot after restart',async()=>{
    const file=fakeFile({'internal://app/schedule.json':JSON.stringify({...empty,settings:{...empty.settings,semesterStart:'2026-09-01',vibrationEnabled:false,reminderMinutes:9},rev:1})});
    const load=loader({file:file.api}); const fs=load('common/fs.js');
    const journal=makeJournal({read:fs.readFile,write:fs.writeFile});
    const text=protocol.snapshot(empty);
    await new Promise((resolve,reject)=>journal.commit(text,{datasetId:'school',sourceRevision:2,appliedDigest:protocol.crc32(text),localDirty:false},e=>e?reject(Error(e)):resolve()));
    const data=loader({file:file.api})('common/data.js');
    const settings=await new Promise(r=>data.loadSettings(r));
    assert.equal(settings.semesterStart,'2026-09-07');
    assert.equal(settings.vibrationEnabled,false);
    assert.equal(settings.reminderMinutes,9);
});

test('local changes after a mobile commit persist and mark the device dirty',async()=>{
    const file=fakeFile({'internal://app/schedule.json':JSON.stringify({...empty,rev:1})});
    const load=loader({file:file.api});const fs=load('common/fs.js');
    const journal=makeJournal({read:fs.readFile,write:fs.writeFile});
    const course={id:'c1',name:'语文',location:'',teacher:'',dayOfWeek:6,startPeriod:1,endPeriod:1,startTime:'08:00',endTime:'08:45',weekType:'all',weeks:[],colorIndex:0};
    const text=protocol.snapshot({...empty,courses:[course]});
    await new Promise((resolve,reject)=>journal.commit(text,{datasetId:'school',sourceRevision:2,appliedDigest:protocol.crc32(text),localDirty:false},e=>e?reject(Error(e)):resolve()));
    const data=loader({file:file.api})('common/data.js');
    assert.equal(await new Promise(r=>data.deleteCourse('c1',r)),true);
    assert.deepEqual(await new Promise(r=>loader({file:file.api})('common/data.js').loadCourses(r)),[]);
    const record=await new Promise((resolve,reject)=>journal.load((e,r)=>e?reject(Error(e)):resolve(r)));
    assert.equal(record.meta.localDirty,true);
    assert.equal(record.meta.sourceRevision,2);
});
