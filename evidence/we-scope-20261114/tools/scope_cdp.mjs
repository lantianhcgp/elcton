// Scope investigation only: output expressions must be allowlisted, never raw cookies/DOM.
import fs from 'node:fs';
import {expressionAllowed,safeLocation} from './scope_tool_policy.mjs';
const base='http://127.0.0.1:9233';
const action=process.argv[2];
let reviewedExpression;
if(action==='screenshot')throw Error('Unredacted screenshot export disabled');
if(action==='eval'){
 reviewedExpression=fs.readFileSync(process.argv[3],'utf8');
 if(!expressionAllowed(process.argv[3],reviewedExpression))throw Error('Expression not in exact reviewed allowlist');
}
const tabs=await (await fetch(base+'/json/list',{signal:AbortSignal.timeout(5000)})).json();
const tab=tabs.find(t=>t.type==='page' && /(^|\.)huawei\.com$/.test(new URL(t.url).hostname));
if(!tab)throw Error('No authorized Huawei page');
const ws=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=()=>reject(Error('CDP connect failed'))});
let seq=0;const pending=new Map();
const send=(method,params={})=>new Promise((resolve,reject)=>{
 const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},35000);
 pending.set(id,m=>{clearTimeout(timer);m.error?reject(Error('CDP command failed '+method)):resolve(m.result)});
 ws.send(JSON.stringify({id,method,params}));
});
ws.onmessage=e=>{const m=JSON.parse(e.data),cb=pending.get(m.id);if(cb){pending.delete(m.id);cb(m)}};
try{
 if(action==='inspect'){
  const r=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>({origin:location.origin,path:location.pathname,readyState:document.readyState,hasPhone:!!document.querySelector('input[placeholder*=手机号]'),hasPassword:!!document.querySelector('input[type=password]'),hasSlider:[...document.querySelectorAll('.yidun_slider,.yidun_popup')].some(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none')}))()`});
  if(r.exceptionDetails)throw Error('Inspect failed');console.log(JSON.stringify(r.result.value,null,2));
 }else if(action==='navigate'){
  const u=new URL(process.argv[3]);if(u.protocol!=='https:'||u.hostname!=='developer.huawei.com')throw Error('Navigation outside authorized console');
  const r=await send('Page.navigate',{url:u.href});console.log(JSON.stringify({path:u.pathname,navigated:!r.errorText}));
 }else if(action==='frames'){
  const t=await send('Page.getFrameTree');const flatten=n=>[n.frame,...(n.childFrames||[]).flatMap(flatten)];
  console.log(JSON.stringify(flatten(t.frameTree).map(f=>({id:f.id,...safeLocation(f.url)})),null,2));
 }else if(action==='eval'){
  let contextId;
  if(process.argv[4]){const t=await send('Page.getFrameTree');const flat=n=>[n.frame,...(n.childFrames||[]).flatMap(flat)];const f=flat(t.frameTree).filter(f=>f.url.includes(process.argv[4]));if(f.length!==1)throw Error('Frame ambiguous');contextId=(await send('Page.createIsolatedWorld',{frameId:f[0].id,worldName:'elcton-scope-inspection'})).executionContextId}
  const r=await send('Runtime.evaluate',{expression:reviewedExpression,contextId,returnByValue:true,awaitPromise:true,userGesture:true});
  if(r.exceptionDetails)throw Error('Safe expression failed; exception redacted');
  const output=JSON.stringify(r.result.value,null,2);if(process.argv[5])fs.writeFileSync(process.argv[5],output+'\n');console.log(output);
 }else if(action==='screenshot'){
  throw Error('Unredacted screenshot export disabled');
 }else if(action==='close'){
  const v=await (await fetch(base+'/json/version')).json();const bw=new WebSocket(v.webSocketDebuggerUrl);await new Promise((res,rej)=>{bw.onopen=res;bw.onerror=rej});bw.send(JSON.stringify({id:1,method:'Browser.close'}));await new Promise(res=>{bw.onclose=res;setTimeout(res,2000)});bw.close();console.log(JSON.stringify({browserCloseRequested:true}));
 }else throw Error('Unknown scope action');
}finally{ws.close()}
