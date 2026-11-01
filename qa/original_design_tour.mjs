// Host-only comparison of two genuine .app builds. Does not alter their bytes.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
const [appUrl,output,mode='restored']=process.argv.slice(2);
if(!appUrl||!output)throw Error('APP_URL OUTPUT [baseline|restored] required');
assert.ok(mode==='baseline'||mode==='restored');
fs.mkdirSync(output,{recursive:true});
const c=await connect(),states=[];
const p='DeviceFeaturePageNav.getCurrentPage()';
const root="document.getElementById('watch-content').shadowRoot";
let name='boot';
async function page(uri){await c.wait(`${p}?.uri===${JSON.stringify(uri)}`);}
async function capture(label){name=label;
 const state=await c.state();
 state.fields=await c.evaluate(`(()=>{const d=${p}.data;return {dayName:d.dayName,weekDisplay:d.weekDisplay,currentWeek:d.currentWeek,selectedDay:d.selectedDay,todayCourses:d.todayCourses,dayCourses:d.dayCourses,courseName:d.courseName,showDeleteConfirm:d.showDeleteConfirm,digits:d.digits,hint:d.hint,rows:d.rows};})()`);
 state.geometry=await c.evaluate(`(()=>{const r=${root},v=document.getElementById('watch-content').getBoundingClientRect();return Array.from(r.querySelectorAll('.header-bar,.course-list,.item-bg,.week-label-bg,.day-tabs,.bottom-bar,.nav-btn,.back-btn,.sync-btn,.dialog,.dialog-row,.dialog-btn,.key,.hint,.digits,.probe-list')).map(e=>{const b=e.getBoundingClientRect();return {class:e.className,x:b.x-v.x,y:b.y-v.y,w:b.width,h:b.height,text:e.textContent}});})()`);
 await c.shot(path.join(output,label+'.png'));fs.writeFileSync(path.join(output,label+'.json'),JSON.stringify(state,null,2));states.push(label);return state;
}
async function scrollTo(selector,list){for(let n=0;n<10;n++){if((await c.rect(selector)).visible)return;await c.scroll(list,90);}assert.ok((await c.rect(selector)).visible,selector);}
try{
 await c.init(appUrl,412,484,false);
 // Deterministic wall-clock fixture, installed before restarting actual application.
 await c.evaluate(`(()=>{const Real=Date;const fixed=Real.parse('2026-11-01T00:00:00Z');function Clock(...args){if(!new.target)return new Real(fixed).toString();return args.length?new Real(...args):new Real(fixed);}Clock.prototype=Real.prototype;Clock.now=()=>fixed;Clock.parse=Real.parse;Clock.UTC=Real.UTC;window.Date=Clock;document.getElementById('restart-btn').click();return true;})()`);
 await page('pages/index/index');await c.wait(`${p}.data.weekDisplay.includes('第9周')`);
 await capture('01-index');await c.click('.nav-btn');await page('pages/week/week');
 await c.click('.day-tab-inactive:nth-child(6)');await c.wait(`${p}.data.selectedDay===6&&${p}.data.dayCourses.length>0`);await capture('02-week');
 await c.click('.week-label-bg');await c.wait(`${p}.data.weekMode==='odd'`);await capture('03-week-odd');
 await c.click('.week-label-bg');await c.wait(`${p}.data.weekMode==='even'`);await capture('04-week-even');
 await c.click('.week-label-bg');await c.wait(`${p}.data.weekMode==='auto'`);await c.click('.item-bg');await page('pages/detail/detail');await c.wait(`!!${p}.data.courseName`);await capture('05-detail');
 await scrollTo('.del-btn','.detail-list');await capture('06-detail-bottom');await c.click('.del-btn');await c.wait(`${p}.data.showDeleteConfirm`);await capture('07-delete-confirm');
 await c.click('.dialog-cancel');await c.wait(`!${p}.data.showDeleteConfirm`);await c.click('.back-btn');await page('pages/week/week');await c.click('.sync-btn');await page('pages/sync/sync');await c.wait(`!${p}.data.running`);await capture('08-legacy-sync');
 await scrollTo('.probe-item:nth-child(3)','.probe-list');await c.click('.probe-item:nth-child(3)');await page('pages/code/code');await capture('09-keyboard');
 for(let n=1;n<=6;n++)await c.click(`.key:nth-child(${n})`);await c.wait(`${p}.data.digits==='1 2 3 4 5 6'`);await capture('10-keyboard-filled');
 await c.click('.key:nth-child(10)');await c.wait(`${p}.data.digits==='1 2 3 4 5 ·'`);await capture('11-keyboard-backspace');
 await c.click('.nav-btn-alt');await page('pages/sync/sync');
 if(mode==='restored'){
  await scrollTo('.probe-item:nth-child(5)','.probe-list');await capture('12-phone-entry');await c.click('.probe-item:nth-child(5)');await page('pages/phone-sync/phone-sync');await c.wait(`${p}.data.ready`);await capture('13-phone-sync');
  await c.click('.back');await page('pages/sync/sync');await capture('14-original-return');
 }
 assert.equal((await c.evaluate('window.__qaErrors')).length,0);
 const report={passed:true,mode,appUrl,states,scope:'412x484 hmlwsim original-app comparison, fixed clock test fixture; no package edits or real devices'};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,mode,states:states.length,report:path.join(output,'report.json')}));
}catch(error){fs.writeFileSync(path.join(output,'FAIL.json'),JSON.stringify({passed:false,name,error:String(error),state:await c.state().catch(()=>null)},null,2));await c.shot(path.join(output,'FAIL.png')).catch(()=>{});throw error;}
finally{await c.evaluate('DeviceFeaturePageNav.clear();true').catch(()=>{});c.close();}
