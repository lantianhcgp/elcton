// Host-only full tour: original GitHub .app, real CDP input and simulated peer traffic.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
const [appUrl,output]=process.argv.slice(2);
if(!appUrl||!output)throw Error('APP_URL OUTPUT required');
fs.mkdirSync(output,{recursive:true});
const c=await connect();const results=[];let label='boot';
const course={id:'qa-sync-c1',name:'语文同步测试课程',teacher:'测试教师',location:'A301',dayOfWeek:6,startPeriod:1,endPeriod:1,startTime:'08:00',endTime:'08:45',weekType:'all',weeks:[],colorIndex:1};
const document={schema:'elcton.schedule',version:1,settings:{semesterStart:'2026-09-01'},courses:[course]};
const packet=(type,id='',more={})=>({protocol:'elcton.sync',version:1,sender:'phone',type,transferId:id,...more});
const root="document.getElementById('watch-content').shadowRoot";
async function page(uri){await c.wait(`DeviceFeaturePageNav.getCurrentPage()?.uri===${JSON.stringify(uri)} && !!DeviceFeaturePageNav.getCurrentPage()?.data?.ready`);}
async function capture(name){const state=await c.state();await c.shot(path.join(output,label+'-'+name+'.png'));fs.writeFileSync(path.join(output,label+'-'+name+'.json'),JSON.stringify(state,null,2));return state;}
async function fullyVisible(selector){return (await c.rect(selector)).visible;}
async function scrollTo(selector,list){for(let i=0;i<8;i++){if(await fullyVisible(selector))return;await c.scroll(list,140);}assert.ok(await fullyVisible(selector),'Not scrollable: '+selector);}
async function exchange(message){const previous=await c.evaluate('window.__qaPeerMessages.length');await c.evaluate(`DeviceFeaturePhoneLink.receiveFromPhone(${JSON.stringify(protocol.ascii(message))});true`);await c.wait(`window.__qaPeerMessages.length>${previous}`);return c.evaluate('window.__qaPeerMessages.at(-1)');}
async function monitorPeer(){await c.evaluate(`(()=>{window.__qaPeerMessages=[];const send=ApiSimWearengine.sendMsg;ApiSimWearengine.sendMsg=function(p){window.__qaPeerMessages.push(JSON.parse(p.message));return send(p);};})()`);}
async function openSync(){await c.click('.sync-btn');await page('pages/phone-sync/phone-sync');await c.click('.start');await c.wait("DeviceFeaturePageNav.getCurrentPage().data.phase==='ready'");}
async function exportDocument(id){const meta=await exchange(packet('EXPORT_REQUEST',id));assert.equal(meta.type,'EXPORT_META');assert.ok(meta.length>0&&meta.length<=32768);let text='';
 for(let seq=0;seq<meta.chunks;seq++){const out=await exchange(packet('EXPORT_NEXT',id,{seq}));assert.equal(out.type,'EXPORT_CHUNK');assert.equal(out.seq,seq);assert.ok(protocol.ascii(out).length<=1024);text+=out.data;}
 assert.equal(text.length,meta.length);assert.equal(protocol.crc32(text),meta.digest);assert.ok(!text.includes('�'),'UTF-8 asset corruption');assert.equal(protocol.snapshot(JSON.parse(text)),text);
 assert.equal((await exchange(packet('EXPORT_DONE',id))).type,'EXPORT_CLOSED');return {meta,text};}
async function publishDocument(doc,id,revision,force,baseDigest){const text=protocol.snapshot(doc),plan=protocol.plan(text,{transferId:id,datasetId:'qa-course-book',sourceRevision:revision,baseDigest,force});
 for(const msg of plan){const out=await exchange(msg);assert.equal(out.type,msg.type==='END'?'APPLIED':'ACK',JSON.stringify(out));if(msg.type==='END')assert.equal(out.digest,protocol.crc32(text));}
 return text;}
async function checkGeometry(width,height,circle){const boxes=await c.evaluate(`(()=>{const r=${root};const v=document.getElementById('watch-content').getBoundingClientRect();return Array.from(r.querySelectorAll('.header-bar,.bottom-bar,.header,.footer,.nav-btn,.sync-btn,.back-btn,.start,.back,.day-tab,.day-tab-inactive,.key,.dialog,.dialog-cancel,.dialog-confirm')).map(e=>{const b=e.getBoundingClientRect();return {class:e.className,x:b.x-v.x,y:b.y-v.y,w:b.width,h:b.height,text:e.textContent}});})()`);
 for(const b of boxes){assert.ok(b.w>0&&b.h>0,JSON.stringify(b));assert.ok(b.x>=-1&&b.y>=-1&&b.x+b.w<=width+1&&b.y+b.h<=height+1,JSON.stringify(b));
  if(circle&&/^(nav-btn|sync-btn|back-btn|start|back|key|dialog-cancel|dialog-confirm|day-tab|day-tab-inactive)$/.test(b.class))for(const x of [b.x+1,b.x+b.w-1])for(const y of [b.y+1,b.y+b.h-1])assert.ok((x-width/2)**2+(y-height/2)**2 <= (width/2+2)**2,'Round boundary: '+JSON.stringify(b));
 }
 return boxes;}
try{
 for(const [w,h,circle] of [[412,484,false],[390,390,true],[466,466,true],[336,480,false],[280,456,false]]){
  label=(circle?'round':'rect')+'-'+w+'x'+h;
  await c.init(appUrl,w,h,circle);await page('pages/index/index');await c.wait("DeviceFeaturePageNav.getCurrentPage().data.todayCourses.length>0");
  await capture('01-index-seed');await checkGeometry(w,h,circle);
  await c.click('.nav-btn');await page('pages/week/week');
  await c.click('.day-slot:nth-child(6) > div');await c.wait('DeviceFeaturePageNav.getCurrentPage().data.selectedDay===6');
  await capture('02-week-seed');await checkGeometry(w,h,circle);
  await c.click('.week-label-bg');await capture('03-week-override');
  // Restore all-week auto filtering with two more real taps.
  await c.click('.week-label-bg');await c.click('.week-label-bg');
  await c.click('.item-bg');await page('pages/detail/detail');await capture('04-detail-top');
  await scrollTo('.del-btn','.detail-list');await capture('05-detail-bottom');
  await c.click('.del-btn');await c.wait('DeviceFeaturePageNav.getCurrentPage().data.showDeleteConfirm');await capture('06-delete-cancel');await checkGeometry(w,h,circle);
  await c.click('.dialog-cancel');await c.wait('!DeviceFeaturePageNav.getCurrentPage().data.showDeleteConfirm');
  await c.click('.back-btn');await page('pages/week/week');await monitorPeer();await openSync();await capture('07-sync-ready');await checkGeometry(w,h,circle);
  // Reverse transfer of actual rawfile-seeded data before the first overwrite.
  const initial=await exportDocument('seed-'+w);assert.equal(JSON.parse(initial.text).courses.length,23);
  await capture('08-seed-exported');
  const rejected=protocol.plan(protocol.snapshot(document),{transferId:'conflict-'+w,datasetId:'qa-course-book',sourceRevision:1,baseDigest:'',force:false});
  assert.equal((await exchange(rejected[0])).code,'CONFLICT');await capture('09-first-overwrite-protected');
  const sent=await publishDocument(document,'publish-'+w,1,true,'');await c.wait("DeviceFeaturePageNav.getCurrentPage().data.phase==='applied'");await capture('10-saved');
  const returned=await exportDocument('return-'+w);assert.equal(returned.text,sent);await capture('11-reverse-readback');
  await c.click('.back');await page('pages/week/week');await c.click('.day-slot:nth-child(6) > div');await c.wait("DeviceFeaturePageNav.getCurrentPage().data.dayCourses.some(x=>x.id==='qa-sync-c1')");await capture('12-course-visible');
  await c.click('.item-bg');await page('pages/detail/detail');await scrollTo('.del-btn','.detail-list');await c.click('.del-btn');await c.wait('DeviceFeaturePageNav.getCurrentPage().data.showDeleteConfirm');
  await c.click('.dialog-confirm');await page('pages/week/week');await c.wait('DeviceFeaturePageNav.getCurrentPage().data.isEmpty');await capture('13-local-delete');
  await openSync();const status=await exchange(packet('HELLO'));assert.equal(status.localDirty,true);
  const conflict=protocol.plan(sent,{transferId:'local-conflict-'+w,datasetId:'qa-course-book',sourceRevision:2,baseDigest:protocol.crc32(sent),force:false});assert.equal((await exchange(conflict[0])).code,'CONFLICT');await capture('14-local-conflict');
  const blank=await exportDocument('deleted-'+w);assert.equal(JSON.parse(blank.text).courses.length,0);
  const emptyText=await publishDocument({...document,courses:[]},'empty-'+w,2,true,protocol.crc32(sent));await capture('15-empty-applied');
  // Missing chunks never destroy the empty baseline, and cancellation resets the flow.
  const bad=protocol.plan(sent,{transferId:'missing-'+w,datasetId:'qa-course-book',sourceRevision:3,baseDigest:protocol.crc32(emptyText),force:false});assert.equal((await exchange(bad[0])).type,'ACK');assert.equal((await exchange(bad.at(-1))).code,'INCOMPLETE_OR_CORRUPT');await capture('16-missing-chunk');
  await c.click('.start');await c.wait('!DeviceFeaturePageNav.getCurrentPage().data.listening');
  assert.equal(await c.evaluate('DeviceFeaturePageNav.getCurrentPage().data.detail'),'旧课表已保留，可重新开始');await capture('17-cancelled');
  await c.click('.legacy');await page('pages/sync/sync');await capture('18-pickup-sync');await checkGeometry(w,h,circle);
  await scrollTo('.probe-item:nth-child(3)','.probe-list');await c.click('.probe-item:nth-child(3)');await page('pages/code/code');await capture('19-keyboard-empty');await checkGeometry(w,h,circle);
  const hintBox=await c.evaluate(`(()=>{const el=${root}.querySelector('.hint');const range=document.createRange();range.selectNodeContents(el);const text=range.getBoundingClientRect(),box=el.getBoundingClientRect();return {text:el.textContent,textW:text.width,textH:text.height,boxW:box.width,boxH:box.height};})()`);
  assert.ok(hintBox.textW<=hintBox.boxW+1 && hintBox.textH<=hintBox.boxH+1,'Hint glyphs exceed allocated bounds: '+JSON.stringify(hintBox));
  for(let i=0;i<6;i++)await c.click('.key:nth-child('+(i+1)+')');await c.wait("DeviceFeaturePageNav.getCurrentPage().data.digits==='1 2 3 4 5 6'");await capture('20-keyboard-filled');
  await c.click('.key:nth-child(10)');await c.wait("DeviceFeaturePageNav.getCurrentPage().data.digits==='1 2 3 4 5 ·'");await c.click('.key:nth-child(6)');await c.click('.nav-btn');await page('pages/sync/sync');await capture('21-code-persisted');
  await c.click('.nav-btn-alt');await page('pages/phone-sync/phone-sync');await c.click('.back');await page('pages/week/week');await c.wait('DeviceFeaturePageNav.getCurrentPage().data.isEmpty');await capture('22-empty-after-return');
  // App restart via its actual simulator control, not by altering app fields.
  await c.evaluate("document.getElementById('restart-btn').click();true");await page('pages/index/index');await c.wait('DeviceFeaturePageNav.getCurrentPage().data.isEmpty');await capture('23-restarted-empty');
  const errors=await c.evaluate('window.__qaErrors');assert.equal(errors.length,0,errors.join('\n'));
  results.push({width:w,height:h,circle,passed:true,states:23,verified:['all-six-pages','seed-assets','both-transfer-directions','overwrite-confirmation','local-delete-conflict','empty','missing-chunk','cancel','keypad','restart']});
 }
 const report={passed:true,windows:results,originalApp:appUrl,simulator:'kqakqakqa hmlwsim with disclosed file/link compatibility patches',scope:'No physical Wear Engine/Health service attached'};
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,windows:results.length,states:results.reduce((s,r)=>s+r.states,0),report:path.join(output,'report.json')}));
}catch(e){fs.writeFileSync(path.join(output,'FAIL-'+label+'.json'),JSON.stringify({passed:false,error:String(e),state:await c.state().catch(()=>null)},null,2));await c.shot(path.join(output,'FAIL-'+label+'.png')).catch(()=>{});throw e;}finally{await c.evaluate('DeviceFeaturePageNav.clear();true').catch(()=>{});c.close();}
