// Host-only integration: genuine Kotlin phone protocol classes <-> final original .app.
// P2P/Android authorization is explicitly simulated; no user device is touched.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {connect} from './cdp.mjs';
import {waitPage,openPhonePage,backToWeek,selectSaturday} from './original_navigation.mjs';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
const [appUrl,jar,output] = process.argv.slice(2);
if(!appUrl||!jar||!output) throw Error('APP_URL KOTLIN_HOST_JAR OUTPUT required');
fs.mkdirSync(output,{recursive:true});
const child=spawn('java',['-jar',jar],{stdio:['pipe','pipe','pipe']});
let pending=null;const queued=[];let errors='';
child.stderr.on('data',d=>{errors+=d.toString();});
createInterface({input:child.stdout}).on('line',line=>{if(pending){const p=pending;pending=null;clearTimeout(p.timer);p.resolve(line);}else queued.push(line);});
child.on('exit',code=>{if(pending){clearTimeout(pending.timer);pending.reject(Error('Kotlin host exited '+code+' '+errors));pending=null;}});
const encode=text=>Buffer.from(text,'utf8').toString('base64');
const decode=text=>Buffer.from(text,'base64').toString('utf8');
async function host(...fields){
 assert.ok(!pending,'No concurrent phone host commands');
 child.stdin.write(fields.join('\t')+'\n');
 const line=queued.length?queued.shift():await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending=null;reject(Error('KOTLIN_HOST_TIMEOUT'));},10000);pending={resolve,reject,timer};});
 const parts=line.split('\t');
 if(parts[0]==='P')return {kind:'publication',accepted:parts[1]==='true',complete:parts[2]==='true',error:parts[3],message:decode(parts[4])};
 if(parts[0]==='E')return {kind:'export',accepted:parts[1]==='true',error:parts[2],message:decode(parts[3])};
 if(parts[0]==='RESULT')return {kind:'result',accepted:parts[1]==='true',error:parts[2],revision:Number(parts[3]),text:decode(parts[4])};
 if(parts[0]==='C')return {kind:'cancel',message:decode(parts[1])};
 throw Error('Unknown host response '+line);
}
const c=await connect();const checks=[];
const root="document.getElementById('watch-content').shadowRoot";
function record(name,data={}){checks.push({name,passed:true,...data});}
async function page(uri){await waitPage(c,uri);}
async function setup(){await c.init(appUrl,412,484,false);await page('pages/index/index');await c.click('.nav-btn');await page('pages/week/week');await openPhonePage(c,true);await c.evaluate(`(()=>{window.__qaPeerMessages=[];const send=ApiSimWearengine.sendMsg;ApiSimWearengine.sendMsg=function(p){window.__qaPeerMessages.push(JSON.parse(p.message));return send(p);};})()`);await c.click('.start');await c.wait("DeviceFeaturePageNav.getCurrentPage().data.phase==='ready'");}
async function exchange(text){assert.ok(text.length<=1024,'Phone packet limit');const previous=await c.evaluate('window.__qaPeerMessages.length');await c.evaluate(`DeviceFeaturePhoneLink.receiveFromPhone(${JSON.stringify(text)});true`);await c.wait(`window.__qaPeerMessages.length>${previous}`);const reply=await c.evaluate('window.__qaPeerMessages.at(-1)');assert.ok(protocol.ascii(reply).length<=1024,'Watch reply limit');return reply;}
async function forward(reply){return host('reply',reply.type,reply.transferId||'',String(reply.seq??-99),reply.digest||'',String(reply.sourceRevision||0),reply.code||'');}
async function publish(text,id,revision,force,base=''){
 let p=await host('publish',encode(text),id,'qa-kotlin-book',String(revision),base,String(force));let packets=0;const transcript=[];
 while(p.message){const message=JSON.parse(p.message);const reply=await exchange(p.message);transcript.push({request:message.type,seq:message.seq,reply:reply.type,code:reply.code});packets++;p=await forward(reply);if(p.error)break;assert.ok(packets<130);}
 return {state:p,packets,transcript};
}
async function takeBack(id){
 let p=await host('export',id);let packets=0;
 while(p.kind!=='result'){
  const reply=await exchange(p.message);assert.notEqual(reply.type,'ERROR',JSON.stringify(reply));packets++;
  if(reply.type==='EXPORT_META')p=await host('meta',reply.transferId,String(reply.length),reply.digest,String(reply.chunks),String(reply.sourceRevision));
  else if(reply.type==='EXPORT_CHUNK')p=await host('chunk',reply.transferId,String(reply.seq),encode(reply.data));
  else throw Error('Unexpected export reply '+reply.type);
  assert.ok(p.accepted&&!p.error,'Kotlin export accepted bounded chunk');assert.ok(packets<130);
 }
 assert.equal((await exchange(protocol.ascii({protocol:'elcton.sync',version:1,sender:'phone',type:'EXPORT_DONE',transferId:id}))).type,'EXPORT_CLOSED');
 return {...p,packets};
}
const course={id:'qa-kotlin-c1',name:'语文跨语言验收',teacher:'测试教师',location:'A301',dayOfWeek:6,startPeriod:1,endPeriod:1,startTime:'08:00',endTime:'08:45',weekType:'odd',weeks:[],colorIndex:1};
const text=protocol.snapshot({schema:'elcton.schedule',version:1,settings:{semesterStart:'2026-09-01'},courses:[course]});
try{
 await setup();
 const seed=await takeBack('seed-kotlin');assert.equal(JSON.parse(seed.text).courses.length,23);record('actual seeded watch data accepted by Kotlin ExportSession',{packets:seed.packets});
 const reject=await publish(text,'protected-kotlin',1,false);assert.equal(reject.state.error,'CONFLICT');assert.equal((await takeBack('seed-after-reject')).text,seed.text);record('first overwrite rejected without force; seed preserved');
 let p=await host('publish',encode(text),'publish-kotlin','qa-kotlin-book','1','','true');
 const before=p.message;const transport=await host('transport');assert.equal(transport.complete,false);assert.equal(transport.message,before);record('transport success never equals APPLIED');
 const begin=await exchange(before);assert.equal(begin.type,'ACK');assert.equal((await exchange(before)).type,'ACK');p=await forward(begin);record('duplicate BEGIN acknowledged once without resetting accepted data');
 const chunk=p.message;const accepted=await exchange(chunk);assert.equal(accepted.type,'ACK');assert.equal((await exchange(chunk)).type,'ACK');p=await forward(accepted);record('duplicate CHUNK idempotent in exercised final app');
 let rounds=0;while(p.message&&JSON.parse(p.message).type!=='END'){p=await forward(await exchange(p.message));assert.ok(++rounds<128);}
 assert.equal(JSON.parse(p.message).type,'END');const end=p.message;const applied=await exchange(end);assert.equal(applied.type,'APPLIED');assert.equal((await exchange(end)).type,'APPLIED');
 const wrong=await host('reply','APPLIED','publish-kotlin','-99','00000000','1','');assert.equal(wrong.accepted,false);assert.equal(wrong.complete,false);record('wrong APPLIED digest rejected by Kotlin publication');
 p=await forward(applied);assert.equal(p.complete,true);assert.equal((await takeBack('roundtrip-kotlin')).text,text);record('Kotlin publication -> final watch journal -> Kotlin reverse result byte-identical');
 const incomplete=await host('publish',encode(text),'cancel-kotlin','qa-kotlin-book','2',protocol.crc32(text),'false');assert.equal((await exchange(incomplete.message)).type,'ACK');const cancellation=await host('cancel');assert.equal((await exchange(cancellation.message)).type,'CANCELLED');assert.equal((await takeBack('after-cancel-kotlin')).text,text);record('CANCEL after BEGIN preserves old committed watch snapshot');
 await backToWeek(c);await selectSaturday(c);await c.wait("DeviceFeaturePageNav.getCurrentPage().data.dayCourses.some(x=>x.id==='qa-kotlin-c1')");await c.click('.item-bg');await page('pages/detail/detail');
 for(let i=0;i<8;i++){if((await c.rect('.del-btn')).visible)break;await c.scroll('.detail-list',130);}await c.click('.del-btn');await c.wait('DeviceFeaturePageNav.getCurrentPage().data.showDeleteConfirm');await c.click('.dialog-confirm');await page('pages/week/week');await c.wait('DeviceFeaturePageNav.getCurrentPage().data.isEmpty');await openPhonePage(c,true);await c.click('.start');await c.wait("DeviceFeaturePageNav.getCurrentPage().data.phase==='ready'");
 const deleted=await takeBack('deleted-kotlin');assert.equal(JSON.parse(deleted.text).courses.length,0);record('physical CDP delete returned as empty proposal to Kotlin, not automatic phone overwrite');
 const dirty=await publish(text,'conflict-kotlin',2,false,protocol.crc32(text));assert.equal(dirty.state.error,'CONFLICT');record('local delete blocks unconfirmed new phone revision');
 const blank=protocol.snapshot({schema:'elcton.schedule',version:1,settings:{semesterStart:'2026-09-01'},courses:[]});const empty=await publish(blank,'empty-kotlin',2,true,protocol.crc32(text));assert.equal(empty.state.complete,true);record('explicit empty publication accepted and confirmed');
 const missing=await host('publish',encode(text),'missing-kotlin','qa-kotlin-book','3',protocol.crc32(blank),'false');assert.equal((await exchange(missing.message)).type,'ACK');const damaged=await exchange(protocol.ascii({protocol:'elcton.sync',version:1,sender:'phone',type:'END',transferId:'missing-kotlin'}));assert.equal(damaged.code,'INCOMPLETE_OR_CORRUPT');record('missing payload cannot damage empty baseline');
 await c.click('.start');await c.wait('!DeviceFeaturePageNav.getCurrentPage().data.listening');await backToWeek(c);await c.evaluate("document.getElementById('restart-btn').click();true");await page('pages/index/index');await c.wait('DeviceFeaturePageNav.getCurrentPage().data.isEmpty');await c.shot(path.join(output,'restarted-empty.png'));record('restart retains committed empty schedule');
 assert.equal((await c.evaluate('window.__qaErrors')).length,0);
 const report={passed:true,checks,originalApp:appUrl,hostJar:jar,phoneClasses:['Wire.kt','TransferSession.kt','ExportSession.kt'],scope:'Pure Kotlin phone protocol and final .app in hmlwsim; no physical Android WearProbe/Auth/P2P/BT/FIT3 I/O or heap claims'};
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,checks:checks.length,report:path.join(output,'report.json')}));
}catch(error){fs.writeFileSync(path.join(output,'FAIL.json'),JSON.stringify({passed:false,error:String(error),phoneStderr:errors,checks,state:await c.state().catch(()=>null)},null,2));await c.shot(path.join(output,'FAIL.png')).catch(()=>{});throw error;}
finally{await c.evaluate('DeviceFeaturePageNav.clear();true').catch(()=>{});c.close();child.stdin.end();child.kill();}
