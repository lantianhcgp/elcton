import test from 'node:test';
import assert from 'node:assert/strict';
import {loader,fakeFile} from './loadSource.mjs';
const empty={schema:'elcton.schedule',version:1,rev:1,updatedAt:0,settings:{semesterStart:'2026-09-01',currentWeek:1,vibrationEnabled:true,reminderMinutes:5},courses:[]};
test('a real empty timetable stays empty instead of becoming a demo',async()=>{
    const file=fakeFile({'internal://app/schedule.json':JSON.stringify(empty)});
    const data=loader({file:file.api})('common/data.js');
    assert.deepEqual(await new Promise(r=>data.loadCourses(r)),[]);
});
test('a read failure in the middle of a file is fatal rather than skipping missing data',async()=>{
    const file=fakeFile({'internal://app/large.json':'a'.repeat(9000)});file.setFault((uri,pos)=>pos===4096);
    const fs=loader({file:file.api})('common/fs.js');
    const result=await new Promise(r=>fs.readFile('internal://app/large.json',(code,text)=>r({code,text})));
    assert.equal(result.code,300);assert.notEqual(result.text,'a'.repeat(4904));
});
test('failed replacements keep the previously loaded cache visible', async()=>{
    const file=fakeFile({'internal://app/schedule.json':JSON.stringify(empty)});
    const data=loader({file:file.api})('common/data.js');
    const before=await new Promise(r=>data.getDoc(r));
    file.api.writeText=({fail})=>queueMicrotask(()=>fail('disk full',300));
    const next={...empty,settings:{...empty.settings,semesterStart:'2026-09-07'}};
    assert.equal(await new Promise(r=>data.replaceDoc(next,r)),false);
    assert.equal((await new Promise(r=>data.loadSettings(r))).semesterStart,before.settings.semesterStart);
});
test('an IO error cannot turn a read failure into a writable demonstration',async()=>{
    const file=fakeFile({'internal://app/schedule.json':JSON.stringify(empty)});file.setFault(()=>true);
    const data=loader({file:file.api})('common/data.js');
    const settings=await new Promise(r=>data.loadSettings(r));
    assert.ok(settings.__loadError);
    assert.equal(await new Promise(r=>data.saveCourses([],r)),false);
    assert.equal(file.files.get('internal://app/schedule.json'),JSON.stringify(empty));
});
