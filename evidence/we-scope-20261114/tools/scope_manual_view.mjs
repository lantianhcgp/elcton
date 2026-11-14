// Task-scoped manual captcha view. No account API writes, certificate calls, session export or automatic drag.
import http from 'node:http';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {manualInputAllowed} from './scope_tool_policy.mjs';
import {connectCdp} from '/data/data/com.termux/files/home/liubai-watch-sign-private/agc-quicklogin.cjs';
const require=createRequire(import.meta.url);
const {createStreamHandler}=require('/data/data/com.termux/files/home/liubai-watch-sign-private/agc-remote-endpoints.cjs');
const tabs=await(await fetch('http://127.0.0.1:9233/json/list')).json();
const tab=tabs.find(t=>{try{const u=new URL(t.url);return t.type==='page'&&/^https:\/\/id[0-9]+\.cloud\.huawei\.com$/.test(u.origin)&&u.pathname==='/CAS/portal/loginAuth.html'}catch{return false}});if(!tab)throw Error('No authorized login page');
const cdp=await connectCdp(tab.webSocketDebuggerUrl);
const captchaState=`(()=>{
 const found=[...document.querySelectorAll('.yidun_popup,.yidun_modal,.yidun_panel')].filter(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden').map(e=>e.getBoundingClientRect()).filter(r=>r.width>=100&&r.height>=100&&r.width<=650&&r.height<=700).sort((a,b)=>b.width*b.height-a.width*a.height)[0];
 return {origin:location.origin,path:location.pathname,captcha:found?{x:found.x,y:found.y,width:found.width,height:found.height}:null};
})()`;
async function loginState(){return cdp.evaluate(captchaState)}
async function guardedSend(method,params){
 const state=await loginState();
 if(!/^https:\/\/id[0-9]+\.cloud\.huawei\.com$/.test(state.origin)||state.path!=='/CAS/portal/loginAuth.html')throw Error('View locked outside login');
 if(method.startsWith('Input.')&&!manualInputAllowed(method,params,state))throw Error('Input outside manual captcha denied');
 return cdp.send(method,params);
}
const live=createStreamHandler({send:guardedSend});
cdp.on('Page.screencastFrame',async p=>{
 try{
  const state=await loginState();
  if(/^https:\/\/id[0-9]+\.cloud\.huawei\.com$/.test(state.origin)&&state.path==='/CAS/portal/loginAuth.html')await live.relay.handleFrame(p);
  else {await cdp.send('Page.screencastFrameAck',{sessionId:p.sessionId});await cdp.send('Page.stopScreencast');}
 }catch{}
});
const html=fs.readFileSync('/data/data/com.termux/files/home/liubai-watch-sign-private/agc-remote-client.html','utf8');
const server=http.createServer(async(req,res)=>{
 try{
  if(await live(req,res))return;
  const route=new URL(req.url,'http://127.0.0.1').pathname;
  if(route==='/'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'});res.end(html)}
  else if(route==='/frame'&&req.method==='GET'){
   const r=await guardedSend('Page.captureScreenshot',{format:'jpeg',quality:55});res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'no-store'});res.end(Buffer.from(r.data,'base64'));
  }else if(route==='/status'&&req.method==='GET'){
   const r=await cdp.evaluate(`(()=>({loggedIn:location.hostname==='developer.huawei.com'&&/hdc-console|agcindex/.test(location.pathname),verified:false,manualCaptchaOnly:true}))()`);res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(r));
  }else{res.writeHead(403);res.end('Manual pointer captcha only; other controls disabled')}
 }catch{if(!res.headersSent)res.writeHead(503);res.end('View temporarily unavailable')}
});
server.listen(8777,'127.0.0.1',()=>console.log(JSON.stringify({url:'http://127.0.0.1:8777',manualCaptchaOnly:true,certificateCalls:false,sessionExports:false})));
async function close(){await live.close();server.close();await cdp.close();process.exit(0)}
process.on('SIGTERM',()=>close());process.on('SIGINT',()=>close());
