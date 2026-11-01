// Host-only validation of the new sync page in five supplied runtime windows.
// Legacy pages remain original; they are reached through their registered route,
// not resized or re-styled to make this new-page check pass.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {connect} from './cdp.mjs';
import {waitPage} from './original_navigation.mjs';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';
const [appUrl,output]=process.argv.slice(2);if(!appUrl||!output)throw Error('APP_URL OUTPUT required');
fs.mkdirSync(output,{recursive:true});const c=await connect(),windows=[];
const p='DeviceFeaturePageNav.getCurrentPage()';
const root="document.getElementById('watch-content').shadowRoot";
let label='boot';
const packet=(type,id='',extra={})=>({protocol:'elcton.sync',version:1,sender:'phone',type,transferId:id,...extra});
async function exchange(m){const n=await c.evaluate('window.__windowReplies.length');await c.evaluate(`DeviceFeaturePhoneLink.receiveFromPhone(${JSON.stringify(protocol.ascii(m))});true`);await c.wait(`window.__windowReplies.length>${n}`);return c.evaluate('window.__windowReplies.at(-1)');}
async function capture(state,w,h,circle){
 const data=await c.state();
 const rects=data.rects;assert.ok(rects.length>=6,'Sync components missing');
 for(const b of rects){assert.ok(b.w>0&&b.h>0&&b.x>=-1&&b.y>=-1&&b.x+b.w<=w+1&&b.y+b.h<=h+1,JSON.stringify(b));
  if(circle&&['start','back'].includes(b.class))for(const x of [b.x+1,b.x+b.w-1])for(const y of [b.y+1,b.y+b.h-1])assert.ok((x-w/2)**2+(y-h/2)**2<=(w/2+2)**2,'Outside circular safety frame');
  if(w===412&&h===484&&['start','back'].includes(b.class))assert.ok(b.y+b.h<=410);
 }
 await c.shot(path.join(output,label+'-'+state+'.png'));fs.writeFileSync(path.join(output,label+'-'+state+'.json'),JSON.stringify(data,null,2));
}
try{
 for(const [w,h,circle] of [[412,484,false],[390,390,true],[466,466,true],[336,480,false],[280,456,false]]){
  label=(circle?'round':'rect')+'-'+w+'x'+h;await c.init(appUrl,w,h,circle);
  // Genuine router, no rewritten package or synthetic page state.
  await c.evaluate("ApiSimRouter.replace({uri:'pages/phone-sync/phone-sync'});true");await waitPage(c,'pages/phone-sync/phone-sync');
  await capture('01-idle',w,h,circle);await c.evaluate(`(()=>{window.__windowReplies=[];const send=ApiSimWearengine.sendMsg;ApiSimWearengine.sendMsg=p=>{window.__windowReplies.push(JSON.parse(p.message));return send(p);};})()`);
  await c.click('.start');await c.wait(`${p}.data.phase==='ready'`);await capture('02-ready',w,h,circle);
  const doc={schema:'elcton.schedule',version:1,settings:{semesterStart:'2026-09-01'},courses:[]};
  const plan=protocol.plan(protocol.snapshot(doc),{transferId:'windows-'+w,datasetId:'window-book',sourceRevision:1,baseDigest:'',force:false});
  assert.equal((await exchange(plan[0])).code,'CONFLICT');await capture('03-overwrite-confirm',w,h,circle);
  plan[0].force=true;for(const msg of plan){const response=await exchange(msg);assert.equal(response.type,msg.type==='END'?'APPLIED':'ACK',JSON.stringify(response));}
  await capture('04-applied',w,h,circle);
  const text=protocol.snapshot(doc),broken=protocol.plan(text,{transferId:'missing-'+w,datasetId:'window-book',sourceRevision:2,baseDigest:protocol.crc32(text),force:false});
  assert.equal((await exchange(broken[0])).type,'ACK');assert.equal((await exchange(broken.at(-1))).code,'INCOMPLETE_OR_CORRUPT');await capture('05-missing',w,h,circle);
  await c.click('.start');await c.wait(`!${p}.data.listening`);assert.ok((await c.evaluate(`${p}.data.detail`)).includes('已保留'));await capture('06-cancel',w,h,circle);
  assert.equal((await c.evaluate('window.__qaErrors')).length,0);windows.push({width:w,height:h,circle,states:6,passed:true});
 }
 const report={passed:true,windows,originalApp:appUrl,scope:'New phone-sync page only. Existing pages keep their original design; this does not certify cross-device original-page layouts or physical hardware.'};fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,windows:windows.length,states:windows.reduce((s,w)=>s+w.states,0),report:path.join(output,'report.json')}));
}catch(error){fs.writeFileSync(path.join(output,'FAIL-'+label+'.json'),JSON.stringify({passed:false,error:String(error),state:await c.state().catch(()=>null)},null,2));await c.shot(path.join(output,'FAIL-'+label+'.png')).catch(()=>{});throw error;}
finally{await c.evaluate('DeviceFeaturePageNav.clear();true').catch(()=>{});c.close();}
