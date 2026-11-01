// Host-only: real UI clicks in the original sync page while simulated file I/O is held.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
import {waitPage,reveal} from './original_navigation.mjs';
const [appUrl,output]=process.argv.slice(2);if(!appUrl||!output)throw Error('APP_URL OUTPUT required');
fs.mkdirSync(output,{recursive:true});const c=await connect();
const page='DeviceFeaturePageNav.getCurrentPage()';
async function capture(name){await c.shot(path.join(output,name+'.png'));fs.writeFileSync(path.join(output,name+'.json'),JSON.stringify(await c.state(),null,2));}
try{
 await c.init(appUrl,412,484,false);await waitPage(c,'pages/index/index');
 await c.evaluate(`(()=>{window.__legacyOriginalFetch=ApiSimFetch.fetch;window.__legacyOriginalWrite=ApiSimFile.writeText;window.__legacyHeld=null;window.__legacyHeldOnce=false;ApiSimFetch.fetch=p=>p.success({code:200,data:p.url.endsWith('health.txt')?'ok':JSON.stringify({schema:'elcton.schedule',version:1,rev:999,updatedAt:100,settings:{semesterStart:'2026-09-01',currentWeek:1,vibrationEnabled:false,reminderMinutes:5},courses:[]})});ApiSimFile.writeText=p=>{if(!window.__legacyHeldOnce&&p.uri.includes('/we-data-')){window.__legacyHeldOnce=true;window.__legacyHeld=p;return;}return window.__legacyOriginalWrite(p);};return true;})()`);
 await c.click('.nav-btn');await waitPage(c,'pages/week/week');
 await c.click('.sync-btn');await waitPage(c,'pages/sync/sync');await c.wait(`!${page}.data.running`);
 await c.click('.nav-btn');await c.wait(`${page}.data.committing&&!!window.__legacyHeld`);
 const generation=await c.evaluate(`${page}.data.gen`);
 await c.click('.nav-btn-alt');assert.equal(await c.evaluate(`${page}.uri`),'pages/sync/sync');assert.equal(await c.evaluate(`${page}.data.gen`),generation);assert.equal(await c.evaluate(`${page}.data.committing`),true);
 await reveal(c,'.probe-item:nth-child(5)');await c.click('.probe-item:nth-child(5)');assert.equal(await c.evaluate(`${page}.uri`),'pages/sync/sync');assert.equal(await c.evaluate(`${page}.data.gen`),generation);await capture('01-both-entry-and-return-locked');
 await c.evaluate('(()=>{const p=window.__legacyHeld;window.__legacyHeld=null;window.__legacyOriginalWrite(p);return true;})()');await c.wait(`!${page}.data.committing&&!${page}.data.running&&${page}.data.localCount===0`);await capture('02-commit-finished');
 await c.click('.nav-btn-alt');await waitPage(c,'pages/index/index');await c.wait(`${page}.data.isEmpty`);await capture('03-return-works-after-commit');
 assert.equal((await c.evaluate('window.__qaErrors')).length,0);
 const report={passed:true,originalApp:appUrl,checks:['original back click cannot supersede a pending import commit','phone-sync entry click cannot supersede the same commit','file callback drains, empty import persists, return works again'],scope:'Actual original-page CDP clicks, explicitly mocked HTTP response and held hmlwsim file callback; no physical I/O proof.'};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,checks:report.checks.length,report:path.join(output,'report.json')}));
}catch(error){fs.writeFileSync(path.join(output,'FAIL.json'),JSON.stringify({passed:false,error:String(error),state:await c.state().catch(()=>null)},null,2));await c.shot(path.join(output,'FAIL.png')).catch(()=>{});throw error;}
finally{await c.evaluate('ApiSimFetch.fetch=window.__legacyOriginalFetch||ApiSimFetch.fetch;ApiSimFile.writeText=window.__legacyOriginalWrite||ApiSimFile.writeText;DeviceFeaturePageNav.clear();true').catch(()=>{});c.close();}
