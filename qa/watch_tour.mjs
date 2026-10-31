import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
const [appUrl,out]=process.argv.slice(2);if(!appUrl||!out)throw Error('APP_URL OUTPUT_DIR required');
const client=await connect();fs.mkdirSync(out,{recursive:true});
const all=[];
const course={id:'qa-c1',name:'模拟测试课程',teacher:'测试教师',location:'A301',dayOfWeek:6,startPeriod:1,endPeriod:1,startTime:'08:00',endTime:'08:45',weekType:'all',weeks:[],colorIndex:1};
const doc={schema:'elcton.schedule',version:1,settings:{semesterStart:'2026-09-01'},courses:[course]};
async function inbound(message){return client.evaluate(`DeviceFeaturePhoneLink.receiveFromPhone(${JSON.stringify(protocol.ascii(message))});true`);}
async function snapshot(name){await client.shot(path.join(out,name+'.png'));const state=await client.state();fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(state,null,2));return state;}
try{
 for(const [width,height,circle] of [[412,484,false],[390,390,true],[466,466,true],[336,480,false]]){
  const label=(circle?'round-':'rect-')+width;
  await client.init(appUrl,width,height,circle);
  await client.wait(`!!document.getElementById('watch-content').shadowRoot.querySelector('.nav-btn')`);
  await client.click('.nav-btn');await client.wait(`DeviceFeaturePageNav.getCurrentPage().uri==='pages/week/week'`);
  await snapshot(label+'-week');
  await client.click('.sync-btn');await client.wait(`DeviceFeaturePageNav.getCurrentPage().uri==='pages/phone-sync/phone-sync' && DeviceFeaturePageNav.getCurrentPage().data.ready`);
  const idle=await snapshot(label+'-sync-idle');
  for(const r of idle.rects){assert.ok(r.w>0&&r.h>0,JSON.stringify(r));assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=width+1&&r.y+r.h<=height+1,JSON.stringify(r));}
  await client.evaluate(`(()=>{window.__peerOut=[];const send=ApiSimWearengine.sendMsg;ApiSimWearengine.sendMsg=function(params){const m=JSON.parse(params.message);window.__peerOut.push(m);return send(params);};})()`);
  await client.click('.start');await client.wait(`DeviceFeaturePageNav.getCurrentPage().data.phase==='ready'`);
  await inbound({protocol:'elcton.sync',version:1,sender:'phone',type:'HELLO',transferId:''});
  const plan=protocol.plan(protocol.snapshot(doc),{transferId:'qa-'+width,datasetId:'qa-school',sourceRevision:1,baseDigest:'',force:true});
  for(const message of plan){const n=await client.evaluate('window.__peerOut.length');await inbound(message);await client.wait(`window.__peerOut.length>${n}`);const last=await client.evaluate('window.__peerOut[window.__peerOut.length-1]');assert.equal(last.type,message.type==='END'?'APPLIED':'ACK');}
  assert.equal((await snapshot(label+'-sync-applied')).phase,'applied');
  await client.click('.back');await client.wait(`DeviceFeaturePageNav.getCurrentPage().uri==='pages/week/week'`);
  await client.wait(`DeviceFeaturePageNav.getCurrentPage().data.dayCourses.some(c=>c.name==='模拟测试课程')`);
  await snapshot(label+'-received-course');
  await client.click('.sync-btn');await client.wait(`DeviceFeaturePageNav.getCurrentPage().uri==='pages/phone-sync/phone-sync'`);
  await client.click('.start');await client.wait(`DeviceFeaturePageNav.getCurrentPage().data.phase==='ready'`);
  const bad=protocol.plan(protocol.snapshot({...doc,courses:[]}),{transferId:'bad-'+width,datasetId:'qa-school',sourceRevision:2,baseDigest:protocol.crc32(protocol.snapshot(doc)),force:false});
  await inbound(bad[0]);await client.wait(`DeviceFeaturePageNav.getCurrentPage().data.phase==='receiving'`);
  await inbound(bad.at(-1));await client.wait(`DeviceFeaturePageNav.getCurrentPage().data.phase==='error'`);
  const failure=await snapshot(label+'-missing-packet');assert.ok(failure.detail.includes('INCOMPLETE'));
  await client.click('.back');await client.wait(`DeviceFeaturePageNav.getCurrentPage().uri==='pages/week/week'`);
  await client.wait(`DeviceFeaturePageNav.getCurrentPage().data.dayCourses.some(c=>c.name==='模拟测试课程')`);
  const errors=await client.evaluate('window.__qaErrors');assert.equal(errors.length,0,errors.join('\n'));
  all.push({width,height,circle,passed:true,scenarios:['navigation','layout','receive','applied','readback','missing-packet-retains-old']});
 }
 fs.writeFileSync(path.join(out,'watch-report.json'),JSON.stringify({passed:true,cases:all,scope:'hmlwsim; not physical Wear Engine link'},null,2));console.log(JSON.stringify({passed:true,windows:all.length,report:path.join(out,'watch-report.json')}));
}catch(error){fs.writeFileSync(path.join(out,'watch-failure.json'),JSON.stringify({passed:false,error:String(error),state:await client.state().catch(()=>null)},null,2));await client.shot(path.join(out,'watch-failure.png')).catch(()=>{});throw error;}finally{client.close();}
