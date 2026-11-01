// Host-only helpers for the original watch navigation. Never mutate app data.
import assert from 'node:assert/strict';
export const pageExpression='DeviceFeaturePageNav.getCurrentPage()';
export async function waitPage(c,uri){
 const requirement=uri==='pages/phone-sync/phone-sync'?`&&${pageExpression}.data.ready`:'';
 await c.wait(`${pageExpression}?.uri===${JSON.stringify(uri)}${requirement}`);
}
export async function reveal(c,selector,list='.probe-list'){
 for(let n=0;n<10;n++){
  if((await c.rect(selector)).visible)return;
  await c.scroll(list,90);
 }
 assert.ok((await c.rect(selector)).visible,'Original list did not reveal '+selector);
}
export async function openPhonePage(c,fromWeek=false){
 if(fromWeek){await c.click('.sync-btn');await waitPage(c,'pages/sync/sync');}
 await reveal(c,'.probe-item:nth-child(5)');await c.click('.probe-item:nth-child(5)');
 await waitPage(c,'pages/phone-sync/phone-sync');
}
export async function backToWeek(c){
 await c.click('.back');await waitPage(c,'pages/sync/sync');
 await c.click('.nav-btn-alt');await waitPage(c,'pages/index/index');
 await c.click('.nav-btn');await waitPage(c,'pages/week/week');
}
export async function selectSaturday(c){
 const d=await c.evaluate(`${pageExpression}.data.selectedDay`);
 if(d!==6)await c.click('.day-tab-inactive:nth-child(6)');
 await c.wait(`${pageExpression}.data.selectedDay===6`);
}
