import test from 'node:test';
import assert from 'node:assert/strict';
import {loader,fakeFile} from './loadSource.mjs';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';

test('phone sync page receives a snapshot through its real API callback and updates saved courses',async()=>{
    const empty={schema:'elcton.schedule',version:1,rev:1,settings:{semesterStart:'2026-09-01',currentWeek:1,vibrationEnabled:false,reminderMinutes:5},courses:[]};
    const file=fakeFile({'internal://app/schedule.json':JSON.stringify(empty)});
    let incoming;const outbound=[];
    const engine={setPackageName(p){p.complete();},setFingerprint(p){p.complete();},subscribeMsg(p){incoming=p.success;p.success({isRegister:true});},unsubscribeMsg(){},sendMsg(p){outbound.push(JSON.parse(p.message));p.success();}};
    let spec;try{spec=loader({file:file.api,wearengine:engine,device:{getInfo(p){p.success({windowWidth:412,windowHeight:484,screenShape:'rect'});}},router:{replace(){}}})('pages/phone-sync/phone-sync.js');}catch(e){if(!e.message.includes('ENOENT'))throw e;}
    assert.equal(typeof spec,'object','phone-sync page missing');
    const page={...spec,...spec.data};delete page.data;
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    try{
        page.onInit.call(page);await sleep(50);page.onListen.call(page);
        assert.doesNotThrow(()=>incoming({isRegister:false,message:'{"sender":"phone"}'}));
        assert.notEqual(page.phase,'error');
        const course={id:'c1',name:'语文',location:'A1',teacher:'老师',dayOfWeek:6,startPeriod:1,endPeriod:1,startTime:'08:00',endTime:'08:45',weekType:'all',weeks:[],colorIndex:0};
        const text=protocol.snapshot({...empty,courses:[course]});
        const plan=protocol.plan(text,{transferId:'t-page',datasetId:'school',sourceRevision:1,baseDigest:'',force:true});
        for(const message of plan){
            incoming({isRegister:false,isFileType:false,message:protocol.ascii(message)});
            await sleep(30);
        }
        assert.equal(outbound.at(-1).type,'APPLIED');
        assert.equal(page.phase,'applied');
        const data=loader({file:file.api})('common/data.js');
        assert.equal((await new Promise(r=>data.loadCourses(r)))[0].name,'语文');
        incoming({isRegister:false,message:protocol.ascii({protocol:'elcton.sync',version:1,sender:'phone',type:'EXPORT_REQUEST',transferId:'e-page'})});
        await sleep(30);
        const meta=outbound.at(-1);assert.equal(meta.type,'EXPORT_META');
        let exported='';
        for(let seq=0;seq<meta.chunks;seq++) {
            incoming({isRegister:false,message:protocol.ascii({protocol:'elcton.sync',version:1,sender:'phone',type:'EXPORT_NEXT',transferId:'e-page',seq})});
            await sleep(30);const chunk=outbound.at(-1);assert.equal(chunk.type,'EXPORT_CHUNK');exported+=chunk.data;
        }
        assert.equal(exported,text);assert.equal(protocol.crc32(exported),meta.digest);
        page.detail='INCOMPLETE_OR_CORRUPT';
        page.onListen.call(page);
        assert.equal(page.status,'已取消');
        assert.equal(page.detail,'旧课表已保留，可重新开始');
    }finally{page.onDestroy.call(page);}
});
