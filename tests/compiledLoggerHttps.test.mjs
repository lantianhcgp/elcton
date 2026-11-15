import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import {EventEmitter} from 'node:events';
const qaURL=new URL('../qa/we-handshake-20261115/compiled-logger-https.mjs',import.meta.url);
const source=fs.readFileSync(qaURL,'utf8');
const modern=source.includes('export function createHTTPSAdapter');
const qa=modern?await import(qaURL):null;
const runtime={endpoint:'ENDPOINT_EXPECTED_SENTINEL',write_key:'KEY_EXPECTED_SENTINEL'};
function check(ok,label){assert.ok(Boolean(ok),label);}
function transport(){
  let respond;
  const req=new EventEmitter(),res=new EventEmitter(),socket=new EventEmitter();
  req.setTimeout=()=>req;req.end=()=>{};req.destroy=()=>{req.destroyed=true;};
  socket.destroy=()=>{socket.destroyed=true;};res.destroy=()=>{res.destroyed=true;};
  res.statusCode=200;
  const https={request(_url,_options,cb){respond=cb;return req;}};
  return {https,req,res,socket,respond(){req.emit('socket',socket);respond(res);}};
}
function adapter(t){
  const requests=[],activeRequests=new Set(),sockets=new Set(),errors=[];
  if(modern)return {...qa.createHTTPSAdapter({runtime,https:t.https,requests,activeRequests,sockets,onError:code=>errors.push(code)}),requests,activeRequests,sockets,errors};
  const start=source.indexOf('function realHTTPS(options){');
  const end=source.indexOf('\nconst ctx=',start);
  const context=vm.createContext({assert,https:t.https,runtime,requests,Buffer});
  vm.runInContext(source.slice(start,end)+';globalThis.fetch=realHTTPS;',context);
  return {fetch:context.fetch,cleanup(){},requests,activeRequests,sockets,errors};
}
function options(overrides={}){return {url:runtime.endpoint,header:{'X-Log-Key':runtime.write_key},method:'POST',data:'{"logs":[]}',success(){},fail(){},...overrides};}
async function lifecycle({primary=false,destroyThrows=false,leak=false,initializeThrows=false}={}){
  const timers=new Set(leak||destroyThrows?[1]:[]),activeRequests=new Set(),sockets=new Set();
  const baseline={info(){}};const consoleAdapter={...baseline};
  let report,cleanupCalls=0;
  const app={onCreate(){if(primary)throw Error('PRIMARY_PRIVATE_SENTINEL');},onDestroy(){if(destroyThrows)throw Error('DESTROY_PRIVATE_SENTINEL');},_elctonLog(){return true;},_elctonLogStatus(){return {seq:2,sent:2,pending:0,failed:0,dropped:0,busy:false};}};
  if(modern){
    const result=await qa.runLifecycle({initialize:async()=>{if(initializeThrows)throw Error('INIT_PRIVATE_SENTINEL');return app;},exercise:async a=>{a.onCreate();},consoleAdapter,consoleBaseline:baseline,timers,activeRequests,sockets,cleanup(){cleanupCalls++;timers.clear();activeRequests.clear();sockets.clear();},writeReport:r=>{report=r;}});
    return {report,result,timers,cleanupCalls};
  }
  const requests=[{logs:[{msg:'MARKER'}],http:200,ack:true},{logs:[],http:200,ack:true}];
  const context=vm.createContext({assert,app,timers,requests,consoleAdapter,ctx:{console:consoleAdapter},marker:'MARKER',stages:[],Date,setTimeout,clearTimeout(){cleanupCalls++;},Buffer,appBytes:Buffer.from('test'),bytes:Buffer.from('test'),sha(){return 'test';},nativeCalls:[],reportFile:'memory-report',path:{dirname(){return '.';}},fs:{mkdirSync(){},writeFileSync(_p,text){report=JSON.parse(text);}},console:{log(){}}});
  let error;
  try{
    if(initializeThrows){vm.runInContext("throw Error('INIT_PRIVATE_SENTINEL')",context);}
    else await vm.runInContext('(async()=>{'+source.slice(source.indexOf('let status, passed=false;'))+'})()',context);
  }catch(e){error=e;}
  return {report,result:{primary_failure:error?.message},timers,cleanupCalls};
}
test('SPEC-01 endpoint and key failures never expose actual/expected private values',()=>{
  for(const mismatch of [{url:'ENDPOINT_ACTUAL_SENTINEL'},{header:{'X-Log-Key':'KEY_ACTUAL_SENTINEL'}}]){
    const a=adapter(transport());let error;
    try{a.fetch(options(mismatch));}catch(e){error=e;}
    const text=error?String(error.stack)+JSON.stringify({actual:error.actual,expected:error.expected}):JSON.stringify(a.errors);
    check(!text.includes('SENTINEL'),'comparison diagnostics must be value-free');
    check(Boolean(error)||a.errors.length>0,'mismatch must fail closed');
  }
});
test('SPEC-02 success then late request error settles exactly once',()=>{
  const t=transport(),a=adapter(t);let success=0,fail=0;
  a.fetch(options({success(){success++;},fail(){fail++;}}));t.respond();t.res.emit('data',Buffer.from('{"ok":true}'));t.res.emit('end');t.req.emit('error',Error('PRIVATE_SENTINEL'));
  check(success===1&&fail===0,'one completion only');a.cleanup();
});
test('SPEC-02 response abort/error are handled and request/socket teardown is tracked',()=>{
  for(const event of ['aborted','error']){
    const t=transport(),a=adapter(t);let fail=0;
    a.fetch(options({fail(){fail++;}}));t.respond();
    check(t.res.listenerCount(event)>0,'response failure handler required');
    t.res.emit(event,Error('PRIVATE_SENTINEL'));
    check(fail===1,'response failure completes once');a.cleanup();
    check(t.req.destroyed&&t.socket.destroyed,'transport resources destroyed');
  }
});
test('SPEC-03 primary failure survives throwing destroy and evidence/cleanup still happen',async()=>{
  const r=await lifecycle({primary:true,destroyThrows:true});
  check(r.report?.passed===false,'failure evidence must be written');
  check(r.result.primary_failure==='EXERCISE_FAILED','safe primary code preserved');
  check(r.result.destroy_failure==='DESTROY_FAILED','separate safe destroy code');
  check(r.cleanupCalls>0&&r.timers.size===0,'emergency cleanup must run');
  check(!JSON.stringify(r.report).includes('SENTINEL'),'report contains no raw exception');
});
test('SPEC-03 initialization failure also writes safe passed=false evidence',async()=>{
  const r=await lifecycle({initializeThrows:true});
  check(r.report?.passed===false&&r.result.primary_failure==='INITIALIZE_FAILED','init safe failure report');
  check(r.cleanupCalls>0,'init failure cleanup');
});
test('SPEC-04 post-destroy leak is recorded before emergency clearing and prevents pass',async()=>{
  const r=await lifecycle({leak:true});
  check(r.report?.passed===false,'destructor leak prevents pass');
  check(r.report.post_destroy?.timers===1,'pre-emergency timer leak visible');
  check(r.report.post_destroy?.pending===0&&r.report.post_destroy?.busy===false,'post-destroy module status captured');
  check(r.timers.size===0,'emergency cleanup still runs');
});
test('SPEC-01 asynchronous response callback exceptions are converted to fixed safe failure codes',()=>{
  const t=transport(),a=adapter(t);let thrown=false;
  a.fetch(options({success(){throw Error('CALLBACK_PRIVATE_SENTINEL');}}));t.respond();t.res.emit('data',Buffer.from('{"ok":true}'));
  try{t.res.emit('end');}catch{thrown=true;}
  check(!thrown&&a.errors.includes('CALLBACK_FAILED'),'async exception must not escape');a.cleanup();
});
test('SPEC-04 clean lifecycle only passes after destruction and captured resource checks',async()=>{
  const r=await lifecycle();
  check(r.report?.passed===true,'healthy lifecycle must pass');
  check(r.report.post_destroy?.console_restored===true&&r.report.post_destroy?.requests===0&&r.report.post_destroy?.sockets===0,'destruction checks required');
});
  for(const resource of ['pending','busy','console','request','socket']){
    test('SPEC-04 '+resource+' residue prevents pass before emergency cleanup',async()=>{
      const timers=new Set(),activeRequests=new Set(resource==='request'?[{}]:[]),sockets=new Set(resource==='socket'?[{}]:[]);
      const baseline={info(){}},consoleAdapter={...baseline};let report;
      if(resource==='console')consoleAdapter.info=()=>{};
      if(!modern){const r=await lifecycle({leak:true});check(r.report?.passed===false,'residue must fail');return;}
      const app={onDestroy(){},_elctonLogStatus(){return {pending:resource==='pending'?1:0,busy:resource==='busy',seq:2,sent:2};}};
      await qa.runLifecycle({initialize:async()=>app,exercise:async()=>{},consoleAdapter,consoleBaseline:baseline,timers,activeRequests,sockets,cleanup(){timers.clear();activeRequests.clear();sockets.clear();},writeReport:r=>{report=r;}});
      check(report?.passed===false&&report.primary_failure==='POST_DESTROY_FAILED','residue must fail before cleanup');
    });
  }
test('SPEC-02 live transport counts are retained until real close notifications',()=>{
  if(!modern){check(false,'live resource tracking missing');return;}
  const t=transport(),a=adapter(t);a.fetch(options());t.respond();t.res.emit('data',Buffer.from('{"ok":true}'));t.res.emit('end');
  check(a.activeRequests.size===1&&a.sockets.size===1,'destroy does not fake close');
  t.req.emit('close');t.socket.emit('close');
  check(a.activeRequests.size===0&&a.sockets.size===0,'close events release tracked resources');
});
test('SPEC-05 public-build placeholder is documented as configured, public only disabled',()=>{
  const text=fs.readFileSync(new URL('../qa/we-handshake-20261115/README-compiled-logger-host.md',import.meta.url),'utf8');
  check(/\/actual\/public(?:-build)?\.app[^\n]*--expect configured/.test(text),'placeholder public-build requires configured');
  check(text.includes('--expect public')&&text.includes('真正禁用'),'public reserved for genuinely disabled input');
});
