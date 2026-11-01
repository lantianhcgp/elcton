// Host-side fault injection against the genuine restored .app. No hardware is touched.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
import {waitPage,reveal} from './original_navigation.mjs';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
const [appUrl,output]=process.argv.slice(2);if(!appUrl||!output)throw Error('APP_URL OUTPUT required');
fs.mkdirSync(output,{recursive:true});const c=await connect(),checks=[];let stage='boot';
const doc={schema:'elcton.schedule',version:1,settings:{semesterStart:'2026-09-01'},courses:[]};
const packet=(type,id='',more={})=>({protocol:'elcton.sync',version:1,sender:'phone',type,transferId:id,...more});
const p='DeviceFeaturePageNav.getCurrentPage()';
async function deliver(m){const raw=typeof m==='string'?m:protocol.ascii(m);await c.evaluate(`DeviceFeaturePhoneLink.receiveFromPhone(${JSON.stringify(raw)});true`);}
async function exchange(m){const n=await c.evaluate('window.__faultReplies.length');await deliver(m);await c.wait(`window.__faultReplies.length>${n}`);return c.evaluate('window.__faultReplies.at(-1)');}
async function capture(name){const state=await c.state();state.uncertain=await c.evaluate(`${p}?.data?._uncertain===true`);fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify(state,null,2));await c.shot(path.join(output,name+'.png'));}
function record(name,more={}){checks.push({name,passed:true,...more});}
async function reverse(id){const m=await exchange(packet('EXPORT_REQUEST',id));assert.equal(m.type,'EXPORT_META');let text='';for(let i=0;i<m.chunks;i++){const r=await exchange(packet('EXPORT_NEXT',id,{seq:i}));assert.equal(r.type,'EXPORT_CHUNK');assert.equal(r.seq,i);text+=r.data;}assert.equal(text.length,m.length);assert.equal(protocol.crc32(text),m.digest);assert.equal((await exchange(packet('EXPORT_DONE',id))).type,'EXPORT_CLOSED');return text;}
async function start(id,revision,semester='2026-09-01'){const text=protocol.snapshot({...doc,settings:{semesterStart:semester}});const plan=protocol.plan(text,{transferId:id,datasetId:'fault-book',sourceRevision:revision,baseDigest:'',force:true});for(const m of plan.slice(0,-1)){const r=await exchange(m);assert.equal(r.type,'ACK',JSON.stringify(r));}return {text,end:plan.at(-1),begin:plan[0]};}
async function hook(kind){await c.evaluate(`(()=>{window.__fault={kind:${JSON.stringify(kind)},used:false,held:null};ApiSimFile.writeText=function(p){const f=window.__fault;const data=p.uri.indexOf('/we-data-')>=0,marker=p.uri.indexOf('/we-record-')>=0;if(!f.used&&((data&&(f.kind==='disk-full'||f.kind==='pre-marker'))||(marker&&(f.kind==='marker'||f.kind==='unknown')))){f.used=true;if(f.kind==='disk-full'){p.fail('injected',300);return;}if(marker)DeviceFeatureVirtualFS.writeText(p.uri,p.text,p.append,{});if(f.kind==='unknown'){p.fail('injected-after-write',300);return;}f.held=p;return;}return window.__originalFileWrite(p);};})()`);}
async function release(physicalWrite){await c.evaluate(`(()=>{const p=window.__fault.held;if(!p)throw Error('No held platform callback');window.__fault.held=null;${physicalWrite?'window.__originalFileWrite(p);':'p.success();'}return true;})()`);}
async function unhook(){await c.evaluate('ApiSimFile.writeText=window.__originalFileWrite;true');}
try{
 await c.init(appUrl,412,484,false);await waitPage(c,'pages/index/index');
 await c.wait(`!!document.getElementById('watch-content').shadowRoot.querySelector('[data-ref="courseList"]')?._rotationFocused`);
 record('original index crown focus is restored after the compiled list mounts without any redesigned layout');
 await c.click('.nav-btn');await waitPage(c,'pages/week/week');await c.click('.sync-btn');await waitPage(c,'pages/sync/sync');
 await reveal(c,'.probe-item:nth-child(5)');
 stage='window-info';await c.evaluate('window.__deviceInfo=ApiSimDevice.getInfo;ApiSimDevice.getInfo=p=>p.fail();true');
 await c.click('.probe-item:nth-child(5)');await c.wait(`${p}?.uri==='pages/phone-sync/phone-sync'`);
 assert.equal(await c.evaluate(`${p}.data.ready`),false);await capture('01-new-sync-window-query-failed');
 await c.evaluate('ApiSimDevice.getInfo=window.__deviceInfo;true');
 // Loading state has no implicit button. Actual OS router replaces only the NEW page for retry.
 await c.evaluate("ApiSimRouter.replace({uri:'pages/phone-sync/phone-sync'});true");await waitPage(c,'pages/phone-sync/phone-sync');await capture('02-new-sync-window-recovered');
 record('device query failure is isolated to new sync page; replacing that page retries with actual supplied metrics');
 await c.evaluate(`(()=>{window.__faultReplies=[];window.__originalFileWrite=ApiSimFile.writeText;const original=ApiSimWearengine.sendMsg;ApiSimWearengine.sendMsg=function(p){window.__faultReplies.push(JSON.parse(p.message));return original(p);};})()`);
 await c.click('.start');await c.wait(`${p}.data.phase==='ready'`);const seed=await reverse('fault-seed');assert.equal(JSON.parse(seed).courses.length,23);
 stage='input-boundary';const plan=protocol.plan(protocol.snapshot(doc),{transferId:'invalid-boundary',datasetId:'fault-book',sourceRevision:1,baseDigest:'',force:true});
 for(const change of [{sourceRevision:9007199254740992},{digest:12345678}])assert.equal((await exchange({...plan[0],...change})).code,'INVALID_BEGIN');
 const nonAscii=JSON.stringify(packet('CHUNK','raw',{seq:0,data:'PRIVATE_FAULT_\u8bfe\u7a0b'}));const bad=await exchange(nonAscii);assert.equal(bad.code,'INVALID_PACKET');assert.ok(!JSON.stringify(bad).includes('PRIVATE_FAULT'));assert.equal(await reverse('fault-after-bad-input'),seed);record('numeric digest, unsafe revision and non-ASCII packet rejected without replacing baseline');
 stage='disk-full';let transfer=await start('disk-full',1);await hook('disk-full');const failed=await exchange(transfer.end);assert.equal(failed.type,'ERROR');assert.notEqual(failed.type,'APPLIED');await unhook();await c.wait(`${p}.data.phase==='error'`);assert.equal(await c.evaluate(`${p}.data.status`),'同步失败');await capture('03-write-failure-before-readback');assert.equal(await reverse('fault-after-disk-full'),seed);await capture('03b-old-data-verified-readback');record('inactive-slot write failure never applies and verified seed remains intact',{code:failed.code});
 stage='pre-marker-cancel';transfer=await start('pre-marker-cancel',2);await hook('pre-marker');await deliver(transfer.end);await c.wait('!!window.__fault.held');assert.equal((await exchange(packet('CANCEL','pre-marker-cancel'))).type,'CANCELLED');await release(true);await unhook();await c.wait(`!${p}.data._receiver.isBusy()`);assert.equal(await reverse('fault-after-pre-marker-cancel'),seed);record('cancel before marker drains issued IO without activating new generation');
 stage='marker-cancel';transfer=await start('marker-cancel',3,'2026-09-07');await hook('marker');await deliver(transfer.end);await c.wait('!!window.__fault.held');const tooLate=await exchange(packet('CANCEL','marker-cancel'));assert.equal(tooLate.code,'COMMIT_IN_PROGRESS');await c.click('.start');assert.equal(await c.evaluate(`${p}.data.listening`),true);assert.ok((await c.evaluate(`${p}.data.status`)).includes('提交'));await capture('04-marker-commit-in-progress');await release(false);await unhook();await c.wait(`${p}.data.phase==='applied'`);assert.equal(await reverse('fault-after-marker'),transfer.text);record('cancel after marker issuance reports commit-in-progress and actual readback resolves result');
 stage='commit-unknown';transfer=await start('commit-unknown',4,'2026-09-14');await hook('unknown');const unknown=await exchange(transfer.end);assert.equal(unknown.code,'COMMIT_UNKNOWN');await unhook();assert.equal(await c.evaluate(`${p}.data._uncertain`),true);assert.ok((await c.evaluate(`${p}.data.detail`)).includes('重连'));await capture('05-commit-unknown');
 assert.equal((await exchange(packet('CANCEL','commit-unknown'))).type,'CANCELLED');assert.ok(!(await c.evaluate(`${p}.data.detail`)).includes('已保留'));await capture('06-wire-cancel-remains-unknown');
 await c.click('.start');assert.ok(!(await c.evaluate(`${p}.data.detail`)).includes('已保留'));await c.click('.start');await c.wait(`${p}.data.phase==='ready'&&!${p}.data._uncertain`);assert.equal(await reverse('fault-after-reconnect'),transfer.text);await capture('07-reconnected-current-data');record('unknown actual commit stays uncertain through wire/local CANCEL; reconnect verifies actual bytes');
 assert.equal((await c.evaluate('window.__qaErrors')).length,0);
 const report={passed:true,checks,originalApp:appUrl,scope:'Compiled restored .app in hmlwsim with explicitly injected SDK failures. No physical Wear Engine, Bluetooth, native filesystem atomicity or JerryScript heap certification.'};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,checks:checks.length,report:path.join(output,'report.json')}));
}catch(error){fs.writeFileSync(path.join(output,'FAIL.json'),JSON.stringify({passed:false,stage,error:String(error),checks,state:await c.state().catch(()=>null)},null,2));await c.shot(path.join(output,'FAIL.png')).catch(()=>{});throw error;}
finally{await c.evaluate('DeviceFeaturePageNav.clear();true').catch(()=>{});c.close();}
