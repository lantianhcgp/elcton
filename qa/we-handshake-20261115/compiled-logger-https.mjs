#!/usr/bin/env node
// Actual supplied compiled APP bytes + Node HTTPS adapters; NOT native/FIT3/WE.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import https from 'node:https';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function ensure(ok){if(!ok)throw Error('QA_CHECK_FAILED');}

// Exported exact CLI adapter; importing this file does not read secrets or run APP.
export function createHTTPSAdapter({runtime,https,requests=[],activeRequests=new Set(),sockets=new Set(),onError=()=>{}}){
  const controls=new Set();
  const note=code=>{try{onError(code);}catch{}};
  function fetch(options){
    let req,res,socket,settled=false;
    const record={logs:[],http:null,ack:false};
    const release=()=>{
      try{res?.destroy?.();}catch{note('TRANSPORT_CLEANUP_FAILED');}
      try{req?.destroy();}catch{note('TRANSPORT_CLEANUP_FAILED');}
      try{socket?.destroy();}catch{note('TRANSPORT_CLEANUP_FAILED');}
      controls.delete(cancel);
      // destroy() schedules close; counts remain live until actual close events.
    };
    const finish=(success,text)=>{
      if(settled)return;
      settled=true;
      if(!success)record.ack=false;
      release();
      try{if(success)options.success({code:record.http,data:text});else options.fail(null,-1);}
      catch{record.callback_failed=true;note('CALLBACK_FAILED');}
    };
    const cancel=()=>{if(!settled){settled=true;record.ack=false;record.cancelled=true;}release();};
    try{
      // Boolean comparisons never attach private actual/expected assertion values.
      if(!(options.url===runtime.endpoint)){note('ENDPOINT_MISMATCH');finish(false);return;}
      if(!(options.header?.['X-Log-Key']===runtime.write_key)){note('WRITE_KEY_MISMATCH');finish(false);return;}
      if(!(options.method==='POST')){note('METHOD_MISMATCH');finish(false);return;}
      record.logs=JSON.parse(options.data).logs;ensure(Array.isArray(record.logs));requests.push(record);
      controls.add(cancel);
      req=https.request(options.url,{method:options.method,headers:options.header,agent:false},response=>{
        res=response;
        const chunks=[];let size=0;
        res.on('error',()=>finish(false));
        res.on('aborted',()=>finish(false));
        res.on('close',()=>{if(!settled)finish(false);});
        res.on('data',chunk=>{
          if(settled)return;
          try{size+=chunk.length;if(size>65536)finish(false);else chunks.push(Buffer.from(chunk));}
          catch{note('RESPONSE_FAILED');finish(false);}
        });
        res.on('end',()=>{
          if(settled)return;
          try{
            record.http=res.statusCode;
            const text=Buffer.concat(chunks).toString('utf8');
            try{const body=JSON.parse(text);record.ack=body.ok===true||body.ok===1;record.accepted=typeof body.accepted==='number'?body.accepted:null;}
            catch{record.ack=false;}
            finish(true,text);
          }catch{note('RESPONSE_FAILED');finish(false);}
        });
      });
      activeRequests.add(req);
      req.on('socket',value=>{
        socket=value;
        socket.on('error',()=>finish(false));
        socket.on('close',()=>sockets.delete(socket));
        if(settled){try{socket.destroy();}catch{note('TRANSPORT_CLEANUP_FAILED');}}else sockets.add(socket);
      });
      req.on('error',()=>finish(false));
      req.on('close',()=>{activeRequests.delete(req);if(!settled)finish(false);});
      req.setTimeout(7000,()=>finish(false));
      req.end(options.data);
    }catch{note('TRANSPORT_FAILED');finish(false);}
  }
  return {fetch,cleanup(){for(const cancel of [...controls])cancel();},activeRequests,sockets};
}

// Shared by CLI and isolated tests. No failure's raw text or stack is retained.
export async function runLifecycle({initialize,exercise,consoleAdapter,consoleBaseline,timers,activeRequests,sockets,cleanup,writeReport,asyncFailure=()=>null}){
  let app,primary_failure=null,destroy_failure=null,cleanup_failure=null,post_destroy=null,module_status=null;
  try{
    try{app=await initialize();}catch{primary_failure='INITIALIZE_FAILED';}
    if(!primary_failure){try{await exercise(app);}catch{primary_failure='EXERCISE_FAILED';}}
    primary_failure=primary_failure||asyncFailure();
  }finally{
    try{if(app){try{app.onDestroy.call(app);}catch{destroy_failure='DESTROY_FAILED';}}}
    finally{
      // Snapshot BEFORE emergency cleanup; harness clearing cannot prove L.stop.
      try{
        const status=app?app._elctonLogStatus():null;
        module_status=status?Object.fromEntries(['seq','sent','pending','failed','dropped','busy'].map(k=>[k,typeof status[k]==='number'||typeof status[k]==='boolean'?status[k]:null])):null;
        post_destroy={pending:module_status?.pending??null,busy:module_status?.busy??null,
          console_restored:Object.keys(consoleBaseline).every(k=>consoleAdapter[k]===consoleBaseline[k]),
          timers:timers.size,requests:activeRequests.size,sockets:sockets.size};
        const clean=app&&post_destroy.pending===0&&(post_destroy.busy===false||post_destroy.busy===0)&&post_destroy.console_restored&&post_destroy.timers===0&&post_destroy.requests===0&&post_destroy.sockets===0;
        if(!clean&&!primary_failure)primary_failure='POST_DESTROY_FAILED';
      }catch{if(!primary_failure)primary_failure='POST_DESTROY_FAILED';}
      try{await cleanup();if(timers.size||activeRequests.size||sockets.size)cleanup_failure='CLEANUP_FAILED';}catch{cleanup_failure='CLEANUP_FAILED';}
    }
  }
  primary_failure=primary_failure||asyncFailure();
  const report={passed:!primary_failure&&!destroy_failure&&!cleanup_failure,primary_failure,destroy_failure,cleanup_failure,module_status,post_destroy,
    remaining_timers:timers.size,remaining_requests:activeRequests.size,remaining_sockets:sockets.size,
    watch_origin:false,wearengine_handshake:false};
  try{await writeReport(report);}catch{report.passed=false;report.report_failure='REPORT_WRITE_FAILED';}
  return report;
}

export async function main(args=process.argv.slice(2)){
  const [appFile,reportFile]=args;
  if(args.length!==2||!appFile||!reportFile||path.resolve(appFile)===path.resolve(reportFile)||fs.existsSync(reportFile)){
    process.exitCode=1;console.error(JSON.stringify({passed:false,failure:'CLI_ARGUMENTS_FAILED',watch_origin:false}));return;
  }
  const timers=new Set(),requests=[],definitions=[],consoleCalls=[],nativeCalls=[],activeRequests=new Set(),sockets=new Set();
  let adapter,ctx,appBytes,bytes,firstAsyncFailure=null;
  const stages=['SDK_CALL','VER_OK','PKG_OK','CERT_OK','REG_OK','HELLO_RECV','READY_CALL','READY_OK','SEND_FAIL'];
  const marker='WE-HOST-HTTPS-'+crypto.randomBytes(8).toString('hex');
  const consoleAdapter={};
  for(const level of ['debug','log','info','warn','error'])consoleAdapter[level]=(...args)=>consoleCalls.push([level,...args]);
  const consoleBaseline={...consoleAdapter};
  const note=code=>{firstAsyncFailure=firstAsyncFailure||code;};
  const schedule=(fn,ms,...args)=>{let id=setTimeout(()=>{timers.delete(id);try{fn(...args);}catch{note('TIMER_CALLBACK_FAILED');}},ms);timers.add(id);return id;};
  const clear=id=>{clearTimeout(id);timers.delete(id);};
  function ViewModel(def){definitions.push(def);Object.assign(this,def);this.data=def.data||def;}
  const result=await runLifecycle({consoleAdapter,consoleBaseline,timers,activeRequests,sockets,asyncFailure:()=>firstAsyncFailure,
    initialize:async()=>{
      // All secret/archive/VM initialization is inside the safe report boundary.
      const runtime=JSON.parse(fs.readFileSync(path.join(os.homedir(),'.hermes/secrets/watch_logger.json'),'utf8'));
      const require=createRequire(import.meta.url),JSZip=require('../../tools/sign/node_modules/jszip');
      appBytes=fs.readFileSync(appFile);
      const outer=await JSZip.loadAsync(appBytes);
      const haps=Object.values(outer.files).filter(f=>!f.dir&&f.name.endsWith('.hap'));ensure(haps.length===1);
      const inner=await JSZip.loadAsync(await haps[0].async('nodebuffer'));
      bytes=await inner.file('assets/js/MainAbility/app.js').async('nodebuffer');ensure(bytes.length>0&&bytes.length<49152);
      const source=bytes.toString('utf8');ensure(Buffer.from(source).equals(bytes));ensure(source.trimStart().startsWith('(function'));
      adapter=createHTTPSAdapter({runtime,https,requests,activeRequests,sockets,onError:note});
      ctx=vm.createContext({console:consoleAdapter,Date,Math,JSON,ViewModel,setTimeout:schedule,clearTimeout:clear,
        setInterval(){throw Error('INTERVAL_UNEXPECTED');},clearInterval:clear,
        requireNative(name){nativeCalls.push(name);
          if(name==='system.configuration')return {};
          if(name==='system.device')return {getInfo(o){try{o.success({model:'HOST_HTTPS_NOT_FIT3'});}catch{note('DEVICE_CALLBACK_FAILED');}}};
          if(name==='system.fetch')return {fetch:adapter.fetch};
          throw Error('NATIVE_MODULE_UNMODELLED');
        }
      },{name:'HOST actual compiled APP HTTPS NOT FIT3',codeGeneration:{strings:false,wasm:false}});
      new vm.Script(source,{filename:'actual-sdk-app.js'}).runInContext(ctx,{timeout:3000});
      ensure(definitions.length===1);const app=definitions[0];ensure(typeof app._elctonLog==='function');return app;
    },
    exercise:async app=>{
      app.onCreate.call(app);ensure(app._elctonLogStatus().seq>=2);
      let deadline=Date.now()+20000;
      while(Date.now()<deadline&&app._elctonLogStatus().sent<2&&!firstAsyncFailure)await new Promise(r=>setTimeout(r,100));
      ensure(app._elctonLogStatus().sent>=2&&!firstAsyncFailure);
      ctx.console.info(marker);
      for(const stage of stages)ensure(app._elctonLog(stage,{code:stage==='SEND_FAIL'?206:0,arg1:stage==='SEND_FAIL'?210301031:0,arg2:0})===true);
      deadline=Date.now()+30000;
      while(Date.now()<deadline&&app._elctonLogStatus().pending>0&&!firstAsyncFailure)await new Promise(r=>setTimeout(r,100));
      const status=app._elctonLogStatus();ensure(status.pending===0&&status.failed===0&&status.dropped===0&&!firstAsyncFailure);
      const logs=requests.flatMap(r=>r.logs);ensure(logs.some(row=>row.msg===marker));
      for(const stage of stages)ensure(logs.some(row=>row.tag==='WE/'+stage));
      ensure(requests.length>=2&&requests.every(r=>r.http===200&&r.ack&&!r.callback_failed));
    },
    async cleanup(){
      try{
        adapter?.cleanup();
        for(const req of activeRequests){try{req.destroy();}catch{note('TRANSPORT_CLEANUP_FAILED');}}
        for(const socket of sockets){try{socket.destroy();}catch{note('TRANSPORT_CLEANUP_FAILED');}}
        const deadline=Date.now()+300;
        while((activeRequests.size||sockets.size)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,10));
      }finally{for(const id of timers)clearTimeout(id);timers.clear();}
    },
    writeReport:report=>{
      // Only this bounded safe subset of generated records is evidence; no raw errors/body/config.
      const logs=requests.flatMap(r=>r.logs).filter(row=>row?.msg===marker||stages.some(stage=>row?.tag==='WE/'+stage)).map(row=>({tag:row.msg===marker?'console':row.tag,msg:row.msg===marker?marker:undefined,seq:typeof row.seq==='number'?row.seq:null}));
      Object.assign(report,{kind:'HOST actual compiled SDK APP -> Node HTTPS -> real cloud ACK; NOT FIT3 or real WE',
        source_app_sha256:appBytes?sha(appBytes):null,app_js_sha256:bytes?sha(bytes):null,original_compiled_bytes:Boolean(bytes),
        marker,stages,expected_logs:logs,requests:requests.map(r=>({http:r.http,ack:r.ack,accepted:r.accepted,rows:r.logs.length})),
        native_calls:nativeCalls.filter(n=>['system.configuration','system.device','system.fetch'].includes(n)),generated_at:new Date().toISOString()});
      fs.mkdirSync(path.dirname(reportFile),{recursive:true});
      fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
    }
  });
  if(!result.passed)process.exitCode=1;
  console.log(JSON.stringify({passed:result.passed,report_written:!result.report_failure,requests:requests.length,
    remaining_timers:timers.size,remaining_requests:activeRequests.size,remaining_sockets:sockets.size,watch_origin:false}));
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
  main().catch(()=>{process.exitCode=1;console.error(JSON.stringify({passed:false,failure:'CLI_FAILED',watch_origin:false}));});
}
