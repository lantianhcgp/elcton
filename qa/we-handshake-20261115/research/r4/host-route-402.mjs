#!/usr/bin/env node
// R4 HOST ONLY. Original HAP-equal compiled bytes; no source factories/rewrites,
// onCreate, network, native engine, devices, keys, production writes or commits.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {assertCompiledSdkShape, makeHostClock} from '../../compiled-we-stages.mjs';

const script=fileURLToPath(import.meta.url);
const qa=path.resolve(path.dirname(script),'../..');
const input='/data/data/com.termux/files/home/lw_build/we-handshake-20261115/r3-ci-43661966735/signed-native-js';
const output=path.join(qa,'evidence/r4/host-route-402.json');
const parentFile=path.join(qa,'evidence/r4/compiled-stage-parent-recheck.json');
const identityFile=path.join(qa,'research/r4/watch-read-hashes.json');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const must=(v,id)=>{if(!v)throw new Error(id);};
const expected={
  '0.js':'b568c9988155357dc2c86d61ed2b77b311b0419f8ecfd52214e91f0bf0109377',
  '4.js':'196ff66d8a6aa7788283233071a1d5d0fee7f34e3b1473150eb86b0cb8b1292d'
};
const report={
  schema:'r4-host-route-402-v1',passed:false,host_only:true,native:false,
  native_verified:false,network:false,real_https:false,real_bluetooth:false,
  device:false,browser:false,mcp:false,production_writes:false,git_commit:false,
  app_onCreate_called:false,actual_vm_original_bytes:false,source_rewritten:false,
  host_observers:'App factory/log observers delegate to original compiled functions; no byte edits.',
  service_version:'5.0.0.402',native_send_behavior:'o.fail() with zero arguments',
  argv:process.argv.slice(),cwd:process.cwd(),node_version:process.version,
  started_at:new Date().toISOString(),script:{path:script,sha256:sha(fs.readFileSync(script))},
  inputs:[],tests:[],limitations:[
    'HOST VM proves only original compiled JavaScript routing under declared stubs.',
    'HOST does not prove FIT3 send root cause, native buffers, JerryScript heap, phone receipt or reception ACK.',
    'HAP byte identity is checked against the existing watch-read-hashes.json; no new installed-device read or HAP signature verification.',
    'isNegotiated is a local registration/open state, not a phone reception ACK or proof of successful send.'
  ]
};

function exercise(bytes,deferred,result){
  result.mode=deferred?'deferred_VERSION_PKG_CERT_REG':'synchronous';
  result.passed=false;result.checks={};result.checkpoints=[];result.sends=[];result.safe_rows=[];
  const check=(id,v)=>{result.checks[id]=Boolean(v);must(v,id);};
  const clock=makeHostClock(),definitions=[],pending=new Map(),violations=[];
  let app,page,listener=null,registered=false,factoryCount=0,channel=null;
  let helloDeliveries=0,fetchCalls=0,appDestroyed=false,pageDestroyed=false;
  const counts={version:0,package:0,fingerprint:0,subscribe:0,send:0,unsubscribe:0,file_get:0,file_write:0,storage_get:0,storage_write:0,device_info:0,brightness:0};
  result.counts=counts;result.violations=violations;
  const contract=(v,id)=>{if(!v){violations.push(id);throw new Error(id);}};
  const forbidden=id=>{violations.push(id);throw new Error(id);};
  const hold=(stage,fn)=>{contract(!pending.has(stage),'duplicate_callback_'+stage);if(deferred)pending.set(stage,fn);else fn();};
  const hello=()=>({isRegister:false,isFileType:false,message:JSON.stringify({protocol:'elcton.sync',version:1,sender:'phone',type:'HELLO',transferId:''})});
  const engine={
    getWearEngineVersion(o){counts.version++;contract(o.sdkVersion==='3'&&typeof o.complete==='function','version_contract');hold('VERSION',()=>o.complete('5.0.0.402'));},
    setPackageName(o){counts.package++;contract(o.appName==='com.hcbiu.elcton'&&typeof o.complete==='function','package_contract');hold('PKG',()=>o.complete());},
    setFingerprint(o){counts.fingerprint++;contract(o.appName==='com.hcbiu.elcton'&&/^[a-fA-F0-9]{64}$/.test(o.appCert)&&typeof o.complete==='function','certificate_contract');hold('CERT',()=>o.complete());},
    subscribeMsg(o){counts.subscribe++;contract(typeof o.success==='function'&&typeof o.fail==='function','subscribe_contract');listener=o.success;hold('REG',()=>{registered=true;o.success({isRegister:true});});},
    unsubscribeMsg(){counts.unsubscribe++;registered=false;listener=null;},
    sendMsg(o){
      counts.send++;
      contract(registered&&factoryCount===1&&page._channel===channel,'same_registered_original_channel');
      contract(o.deviceId==='remote'&&o.bundleName==='com.hcbiu.elcton'&&o.abilityName===''&&typeof o.message==='string'&&typeof o.success==='function'&&typeof o.fail==='function','send_contract');
      const p=JSON.parse(o.message),ascii=/^[\x00-\x7f]*$/.test(o.message);
      contract(ascii&&o.message.length<=1024&&p.protocol==='elcton.sync'&&p.version===1&&p.sender==='watch'&&p.type==='READY','ascii_ready_contract');
      result.sends.push({index:counts.send,trigger:helloDeliveries===0?'REG_initial_READY':'listener_HELLO_'+helloDeliveries,
        deviceId:o.deviceId,bundleName:o.bundleName,abilityName:o.abilityName,
        protocol:p.protocol,version:p.version,sender:p.sender,type:p.type,
        bytes:Buffer.byteLength(o.message),max_bytes:1024,ascii,
        payload_sha256:sha(o.message),same_channel:page._channel===channel,
        fail_argument_count:0,fail_argument_types:['undefined','undefined']});
      o.fail();
    }
  };
  // Extra engine APIs, including connectChannel, are unavailable and fail closed.
  const nativeEngine=new Proxy(engine,{get(target,k){if(k==='__esModule')return false; // SDK CommonJS interop metadata, not a native API.
    if(typeof k==='string'&&!Object.hasOwn(target,k))return forbidden('unmodelled_engine_api_'+k);return target[k];}});
  const native={
    'system.configuration':{},
    'system.device':{getInfo(o){counts.device_info++;o.success({brand:'HOST',model:'HOST_NOT_FIT3',windowWidth:412,windowHeight:484});}},
    'system.router':{getParams(){return {};},replace(){forbidden('navigation_forbidden');},push(){forbidden('navigation_forbidden');},back(){forbidden('navigation_forbidden');}},
    'system.file':{get(o){counts.file_get++;o.fail(null,301);},readText(){forbidden('file_readText_forbidden');},writeText(){counts.file_write++;forbidden('file_write_forbidden');}},
    'system.storage':{get(o){counts.storage_get++;if(o.success)o.success('');},set(){counts.storage_write++;forbidden('storage_write_forbidden');}},
    'system.wearengine':nativeEngine,
    'system.brightness':{setKeepScreenOn(o){counts.brightness++;contract(typeof o.keepScreenOn==='boolean','brightness_contract');if(o.success)o.success();}},
    'system.fetch':{fetch(){fetchCalls++;forbidden('network_fetch_forbidden');}}
  };
  function nativeRequire(name){const n=name.replace(/^@/,'');contract(Object.hasOwn(native,n),'unmodelled_native_module');return native[n];}
  function ViewModel(def){definitions.push(this);Object.assign(this,def.data||{},def);this.data=def.data||def;}
  class HostDate extends Date{constructor(...args){super(...(args.length?args:[clock.now()]));}static now(){return clock.now();}}
  const silent=()=>{};
  const context=vm.createContext({ViewModel,console:{debug:silent,log:silent,info:silent,warn:silent,error:silent},requireNative:nativeRequire,require:nativeRequire,
    setTimeout:(fn,ms)=>clock.set(fn,ms),clearTimeout:clock.clear,
    setInterval:(fn,ms)=>clock.set(fn,ms,true),clearInterval:clock.clear,
    Date:HostDate,fetch(){fetchCalls++;forbidden('global_fetch_forbidden');}},
    {name:'R4_ORIGINAL_BYTES_HOST_NOT_NATIVE',codeGeneration:{strings:false,wasm:false}});
  function execute(b,name){const text=b.toString('utf8');check('utf8_roundtrip_'+name,Buffer.from(text).equals(b));assertCompiledSdkShape(b);return new vm.Script(text,{filename:name}).runInContext(context,{timeout:3000});}
  function checkpoint(stage){result.checkpoints.push({stage,send_count:counts.send,factory_count:factoryCount,version:counts.version,package:counts.package,fingerprint:counts.fingerprint,subscribe:counts.subscribe,unsubscribe:counts.unsubscribe,isNegotiated:channel?channel.isNegotiated():false,phase:page.phase});}
  function cleanup(){
    if(page&&!pageDestroyed){page.onDestroy();pageDestroyed=true;}
    if(app&&!appDestroyed){app.onDestroy();appDestroyed=true;}
    result.cleanup={timers:clock.timers.size,listener_closed:listener===null,registered,app_destroyed:appDestroyed,page_destroyed:pageDestroyed,
      page_channel_null:page? page._channel===null:false,page_receiver_null:page? page._receiver===null:false,page_exporter_null:page? page._exporter===null:false,page_timer_null:page? page._timer===null:false};
  }
  try{
    app=execute(bytes['0.js'],'original-hap-0.js');
    check('single_original_app_ViewModel',definitions.length===1&&definitions[0]===app);
    check('original_app_factory_exists',typeof app._elctonWearChannel==='function');
    context.$app={$def:app};
    const originalFactory=app._elctonWearChannel,originalLog=app._elctonLog;
    app._elctonWearChannel=function(...args){factoryCount++;channel=originalFactory.apply(this,args);return channel;};
    app._elctonLog=function(stage,meta){
      contract(typeof stage==='string'&&/^[A-Z0-9_]+$/.test(stage),'safe_stage_contract');
      const safe={};for(const k of ['code','bytes','arg1','arg2','type1','type2','len1','len2','service','v0','v1','v2','v3']){
        if(Object.hasOwn(meta||{},k)){const v=meta[k];contract(typeof v==='number'||typeof v==='string'&&/^-?\d+$/.test(v),'safe_numeric_meta_contract');safe[k]=Number(v);}
      }
      result.safe_rows.push({stage,meta:safe});return originalLog.call(this,stage,meta);
    };
    // Deliberately never call app.onCreate: compiled configured logger stays off.
    page=execute(bytes['4.js'],'original-hap-4.js');
    check('single_original_page_ViewModel',definitions.length===2&&definitions[1]===page);
    page.onInit();check('host_device_ready',page.ready===true);page.onListen();
    check('single_app_channel_factory',factoryCount===1&&page._channel===channel);
    if(deferred){
      for(const stage of ['VERSION','PKG','CERT','REG']){
        checkpoint('before_'+stage);check('zero_send_before_'+stage,counts.send===0);
        check('not_negotiated_before_'+stage,channel.isNegotiated()===false);
        check('exact_held_callback_'+stage,pending.size===1&&pending.has(stage));
        if(stage==='REG'){
          check('listener_installed_before_REG',typeof listener==='function');
          listener(hello());checkpoint('preREG_HELLO_ignored');
          check('preREG_HELLO_no_send_or_route',counts.send===0&&!result.safe_rows.some(r=>r.stage==='HELLO_RECV'));
        }
        const fn=pending.get(stage);pending.delete(stage);fn();
      }
    }
    checkpoint('REG_initial_READY');
    check('one_initial_REG_send',counts.send===1&&registered&&typeof listener==='function');
    check('negotiated_despite_initial_send_fail',channel.isNegotiated()===true);
    for(let i=1;i<=4;i++){helloDeliveries=i;listener(hello());check('HELLO_'+i+'_adds_one_READY',counts.send===i+1);}
    checkpoint('after_four_listener_HELLO');
    check('one_version_package_certificate_subscription',counts.version===1&&counts.package===1&&counts.fingerprint===1&&counts.subscribe===1);
    check('exact_five_noargfail_READY_sends',counts.send===5&&result.sends.length===5);
    check('four_listener_HELLO_routes',result.safe_rows.filter(r=>r.stage==='HELLO_RECV').length===4);
    const failed=result.safe_rows.filter(r=>r.stage==='SEND_FAIL'),readyFailed=result.safe_rows.filter(r=>r.stage==='READY_FAIL');
    check('five_original_noargfail_trace_code206_type0',failed.length===5&&readyFailed.length===5&&[...failed,...readyFailed].every(r=>r.meta.code===206&&r.meta.type1===0&&r.meta.type2===0&&!Object.hasOwn(r.meta,'arg1')&&!Object.hasOwn(r.meta,'arg2')));
    check('compiled_service402_trace',result.safe_rows.some(r=>r.stage==='VER_OK'&&r.meta.service===402));
    result.channel_summary=channel.summary();result.isNegotiated_after_five_failed_sends=channel.isNegotiated();
    result.phone_reception_ack_injected=false;result.native_send_success_count=0;
    check('negotiation_is_not_reception_ACK',channel.isNegotiated()===true&&/SEND_206/.test(channel.summary()));
    check('page_ready_despite_SEND_206',page.listening===true&&page.phase==='ready');
    check('valid_zero_timer_exercised',clock.cleared.includes(0));
    const timer=page._timer;check('watchdog_timer_exists',clock.timers.has(timer));clock.fire(timer);
    check('watchdog_retains_registered_ready_without_send_ACK',page.listening===true&&page.phase==='ready'&&channel.isNegotiated()===true&&counts.send===5);
    check('no_extra_engine_API',Object.keys(engine).join(',')==='getWearEngineVersion,setPackageName,setFingerprint,subscribeMsg,unsubscribeMsg,sendMsg'&&violations.length===0);
    check('no_network_or_writes',fetchCalls===0&&counts.file_write===0&&counts.storage_write===0);
    check('empty_file301_path_exercised',counts.file_get>0);
    cleanup();check('destroy_cleanup_zero_timers_and_subscription',clock.timers.size===0&&listener===null&&!registered&&counts.unsubscribe===2&&page._channel===null&&page._receiver===null&&page._exporter===null&&page._timer===null&&!page.listening);
    result.factory_count=factoryCount;result.fetch_calls=fetchCalls;result.passed=true;
  }catch(e){result.failure=/^[A-Za-z0-9_]+$/.test(e.message)?e.message:'host_execution_contract_failed';}
  finally{try{cleanup();}catch{result.cleanup_failure=true;result.passed=false;}result.factory_count=factoryCount;result.fetch_calls=fetchCalls;}
}

let parentHash;
try{
  const args=process.argv.slice(2);
  must(args.length===4&&args[0]==='--compiled-dir'&&args[1]===input&&args[2]==='--report'&&path.resolve(args[3])===output,'exact_cli_paths_required');
  must(fs.realpathSync(path.dirname(output))===path.dirname(output),'report_parent_symlink_forbidden');
  if(fs.existsSync(output))must(!fs.lstatSync(output).isSymbolicLink(),'report_symlink_forbidden');
  const originBytes=fs.readFileSync(identityFile),origin=JSON.parse(originBytes);
  const parentBytes=fs.readFileSync(parentFile),parent=JSON.parse(parentBytes);parentHash=sha(parentBytes);
  must(parent.passed===true&&parent.callback_contract.version_complete==='5.0.0.401','existing_parent401_evidence_required');
  report.parent_v401={path:parentFile,sha256:parentHash,passed:parent.passed,service_version:parent.callback_contract.version_complete,reexecuted:false};
  const hap=origin.read_inputs.filter(x=>x.path.startsWith('/data/data/')&&x.path.endsWith('.hap'));
  must(hap.length===1,'existing_HAP_identity_required');
  report.hap_identity={evidence_path:identityFile,evidence_sha256:sha(originBytes),hap_path:hap[0].path,hap_sha256:hap[0].sha256,identity_basis:'Existing HAP extraction hashes only; no new device or HAP execution.'};
  const bytes={};
  for(const [name,entry] of [['0.js','assets/js/MainAbility/app.js'],['4.js','assets/js/MainAbility/pages/phone-sync/phone-sync.js']]){
    const file=path.join(input,name),b=fs.readFileSync(file),h=sha(b),documented=origin.hap.entries.filter(e=>e.path===entry);
    must(/^[a-f0-9]{64}$/.test(expected[name])&&h===expected[name],'exact_original_sha_'+name.replace('.','_'));
    must(documented.length===1&&documented[0].sha256===h&&documented[0].bytes===b.length,'HAP_documented_identity_'+name.replace('.','_'));
    bytes[name]=b;report.inputs.push({path:file,sha256:h,bytes:b.length,hap_entry:entry,equals_documented_HAP:true});
  }
  for(const deferred of [false,true]){const r={};report.tests.push(r);exercise(bytes,deferred,r);}
  report.actual_vm_original_bytes=report.tests.every(r=>r.checks.single_original_app_ViewModel&&r.checks.single_original_page_ViewModel);
  report.inputs_unchanged=report.inputs.every(e=>sha(fs.readFileSync(e.path))===e.sha256);
  report.parent_evidence_unchanged=sha(fs.readFileSync(parentFile))===parentHash;
  report.watch_read_evidence_unchanged=sha(fs.readFileSync(identityFile))===report.hap_identity.evidence_sha256;
  report.check_counts={passed:report.tests.reduce((n,r)=>n+Object.values(r.checks).filter(Boolean).length,0),failed:report.tests.reduce((n,r)=>n+Object.values(r.checks).filter(v=>!v).length,0)};
  report.passed=report.tests.length===2&&report.tests.every(r=>r.passed)&&report.inputs_unchanged&&report.parent_evidence_unchanged&&report.watch_read_evidence_unchanged;
}catch(e){report.failure=/^[A-Za-z0-9_]+$/.test(e.message)?e.message:'host_input_or_contract_failed';}
report.finished_at=new Date().toISOString();report.exit_code=report.passed?0:1;
// The only write target is the new R4 report; it cannot overwrite production/input/parent files.
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify({passed:report.passed,exit_code:report.exit_code,host_only:true,network:false,device:false,
  tests:report.tests.map(r=>({mode:r.mode,passed:r.passed,sends:r.counts?.send,channel_factory_count:r.factory_count,final_timers:r.cleanup?.timers,failure:r.failure})),
  checks:report.check_counts,report:output,failure:report.failure})+'\n');
process.exitCode=report.exit_code;
