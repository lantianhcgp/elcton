// LOCAL POLICY TESTS; no CDP connections, AGC requests, or device actions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {expressionAllowed,manualInputAllowed,safeLocation} from './scope_tool_policy.mjs';
let tests=0;
const tools=new URL('.',import.meta.url);
for(const name of ['scope_health_init.js','scope_grants_readonly.js']){
 const source=fs.readFileSync(new URL(name,tools),'utf8');
 assert.equal(expressionAllowed(new URL(name,tools),source),true);tests++;
 assert.equal(expressionAllowed(new URL(name,tools),source+';document.cookie'),false);tests++;
}
assert.equal(expressionAllowed(new URL('scope_page_state.js',tools),'document.cookie'),false);tests++;
assert.equal(expressionAllowed(new URL('/tmp/scope_health_init.js','file:'),'anything'),false);tests++;
const current={origin:'https://id5.cloud.huawei.com',path:'/CAS/portal/loginAuth.html',captcha:{x:800,y:360,width:340,height:260}};
const move={type:'mouseMoved',x:850,y:550};
assert.equal(manualInputAllowed('Input.dispatchMouseEvent',move,current),true);tests++;
for(const state of [
 {...current,origin:'https://developer.huawei.com'},
 {...current,origin:'https://id5.cloud.huawei.com.attacker.invalid'},
 {...current,captcha:null},
 {...current,path:'/not-login'},
 {...current,captcha:{x:0,y:0,width:1920,height:1080}}
]){assert.equal(manualInputAllowed('Input.dispatchMouseEvent',move,state),false);tests++;}
assert.equal(manualInputAllowed('Input.dispatchMouseEvent',{...move,x:50},current),false);tests++;
assert.equal(manualInputAllowed('Input.dispatchKeyEvent',{key:'Enter'},current),false);tests++;
assert.equal(manualInputAllowed('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:850,y:550}]},current),true);tests++;
assert.deepEqual(safeLocation('https://developer.huawei.com/console?secret=LOCAL_FIXTURE#token=LOCAL_FIXTURE'),{origin:'https://developer.huawei.com',path:'/console'});tests++;
for(const args of [['screenshot','unused.png'],['eval',new URL('scope_page_state.js',tools).pathname]]){
 const probe=spawnSync(process.execPath,[new URL('scope_cdp.mjs',tools).pathname,...args],{encoding:'utf8',timeout:5000});
 assert.equal(probe.status,1);
 assert.match(probe.stderr,/Unredacted screenshot export disabled|Expression not in exact reviewed allowlist/);
 assert.doesNotMatch(probe.stderr,/fetch failed|ECONNREFUSED/);tests++;
}
const manual=fs.readFileSync(new URL('scope_manual_view.mjs',tools),'utf8');
assert.match(manual,/createStreamHandler\(\{send:guardedSend\}\)/);tests++;
assert.match(manual,/manualInputAllowed\(method,params,state\)/);tests++;
assert.match(manual,/guardedSend\('Page\.captureScreenshot'/);tests++;
const result={kind:'LOCAL_POLICY_TESTS_NOT_LIVE_PROOF',tests,passed:true,live_scope_verified:false,checked_at:new Date().toISOString()};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
