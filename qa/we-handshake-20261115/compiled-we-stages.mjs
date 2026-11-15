#!/usr/bin/env node
// HOST ONLY: original compiled app/page bytes. No HTTP, Bluetooth, native engine,
// source factories, module rewriting, private config, sign keys or phone access.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {selectCompiledChannel} from './compiled-logger-host.mjs';
const require = createRequire(import.meta.url);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
class HostError extends Error {}
const need = (value, code) => { if (!value) throw new HostError(code); };

// Match the SDK's actual module-table/cache/bootstrap AST, not local names:
// compact_p2p_page alpha-renames the table and cache, but keeps require reserved.
// Parsing observes original bytes only; no payload rewriting or source fallback.
export function assertCompiledSdkShape(bytes) {
  const fail=()=>{throw new HostError('compiled_sdk_shape_required');};
  const acorn=require('../../tools/sign/node_modules/acorn');
  // Exact loader grammar below supplies its bindings; no generic scope parser.
  // Tokens are AST objects, never Identifier.name strings (including sentinels).
  const canonical=(node,bindings)=>{
    const visit=(value,parent,key)=>{
      if(Array.isArray(value))return value.map(v=>visit(v,parent,key));
      if(!value || typeof value!=='object')return value;
      const bindingPosition=(parent?.type==='FunctionDeclaration' && (key==='id' || key==='params')) ||
        (parent?.type==='VariableDeclarator' && key==='id');
      const referencePosition=(parent?.type==='MemberExpression' && (key==='object' || (key==='property' && parent.computed))) ||
        (parent?.type==='BinaryExpression' && (key==='left' || key==='right')) ||
        (parent?.type==='CallExpression' && (key==='callee' || key==='arguments')) ||
        (parent?.type==='ReturnStatement' && key==='argument');
      if(value.type==='Identifier' && (bindingPosition || referencePosition) && bindings.has(value.name))
        return {type:bindings.get(value.name)};
      return Object.fromEntries(Object.entries(value).filter(([k])=>!['start','end','raw'].includes(k))
        .map(([k,v])=>[k,visit(v,value,k)]));
    };
    return JSON.stringify(visit(node,null,null));
  };
  try {
    const program=acorn.parse(bytes.toString('utf8'),{ecmaVersion:2020});
    const call=program.body[0]?.expression, fn=call?.callee;
    if(program.body.length!==1 || program.body[0].type!=='ExpressionStatement' || call?.type!=='CallExpression' || call.arguments.length || fn?.type!=='FunctionExpression' || fn.id || fn.params.length || fn.async || fn.generator)fail();
    const body=fn.body.body;
    const variable=n=>n?.type==='VariableDeclaration' && n.kind==='var' && n.declarations.length===1 && n.declarations[0].id.type==='Identifier' ? n.declarations[0] : null;
    const table=variable(body[0]), cache=variable(body[1]), loader=body[2], output=variable(body[3]);
    if(body.length!==5 || table?.init?.type!=='ObjectExpression' || !table.init.properties.length || cache?.init?.type!=='ObjectExpression' || cache.init.properties.length || loader?.type!=='FunctionDeclaration' || loader.id.name!=='__webpack_require__' || loader.params.length!==1 || loader.params[0].type!=='Identifier' || !output || body[4].type!=='ReturnStatement' || body[4].argument?.type!=='Identifier' || body[4].argument.name!==output.id.name)fail();
    const modules=table.init.properties, ids=new Set();
    for(const m of modules){
      if(m.type!=='Property' || m.computed || m.method || m.kind!=='init' || m.key.type!=='Literal' || !Number.isSafeInteger(m.key.value) || m.key.value<0 || ids.has(m.key.value) || m.value.type!=='FunctionExpression' || m.value.async || m.value.generator || !m.value.params.length || !m.value.params.every(p=>p.type==='Identifier'))fail();
      ids.add(m.key.value);
    }
    const entry=output.init;
    if(entry?.type!=='CallExpression' || entry.callee.type!=='Identifier' || entry.callee.name!==loader.id.name || entry.arguments.length!==1 || entry.arguments[0].type!=='Literal' || !ids.has(entry.arguments[0].value))fail();
    const entryModule=modules.find(m=>m.key.value===entry.arguments[0].value).value;
    if(!entryModule.body.body.some(s=>s.type==='ExpressionStatement' && s.expression.type==='AssignmentExpression' && s.expression.operator==='=' && s.expression.left.type==='MemberExpression' && !s.expression.left.computed && s.expression.left.object.name===entryModule.params[0].name && s.expression.left.property.name==='exports' && s.expression.right.type==='NewExpression' && s.expression.right.callee.name==='ViewModel' && s.expression.right.arguments.length===1))fail();
    const cached=variable(loader.body.body[0]), loaded=variable(loader.body.body[2]);
    if(!cached || !loaded)fail();
    const roles=['SdkTableBinding','SdkCacheBinding','SdkModuleIdBinding','SdkCachedBinding','SdkModuleBinding','SdkLoaderBinding'];
    const bindings=new Map([table.id.name,cache.id.name,loader.params[0].name,cached.id.name,loaded.id.name,loader.id.name].map((name,i)=>[name,roles[i]]));
    if(bindings.size!==roles.length)fail();
    const expected=acorn.parse('function __webpack_require__(ID){var CACHED=CACHE[ID];if(CACHED!==undefined){return CACHED.exports}var MODULE=CACHE[ID]={exports:{}};TABLE[ID](MODULE,MODULE.exports,__webpack_require__);return MODULE.exports}',{ecmaVersion:2020}).body[0];
    const expectedBindings=new Map(['TABLE','CACHE','ID','CACHED','MODULE','__webpack_require__'].map((name,i)=>[name,roles[i]]));
    if(canonical(loader,bindings)!==canonical(expected,expectedBindings))fail();
    return true;
  } catch(error) { if(error instanceof HostError)throw error;fail(); }
}

export function makeHostClock() {
  const timers = new Map(), cleared = [];
  let next = 0, now = 1700000000000;
  function set(fn, ms, repeat = false) {
    need(typeof fn === 'function' && Number.isFinite(Number(ms)) && Number(ms) >= 0, 'host_timer_contract');
    const id = next++; timers.set(id, {id, fn, delay:Number(ms), due:now+Number(ms), repeat}); return id;
  }
  function clear(id) { cleared.push(id); timers.delete(id); }
  function fire(id) {
    const t = timers.get(id); need(t, 'host_timer_missing'); now = Math.max(now,t.due);
    if (!t.repeat) timers.delete(id);
    t.fn();
    // A self-clearing interval must never be resurrected.
    if (t.repeat && timers.get(id) === t) t.due = now + t.delay;
  }
  return {timers,cleared,set,clear,fire,now:()=>now};
}

async function loadApp(file, report) {
  need(fs.statSync(file).isFile() && fs.statSync(file).size <= 64*1024*1024, 'app_input_bound');
  const bytes = fs.readFileSync(file), JSZip = require('../../tools/sign/node_modules/jszip');
  const outer = await JSZip.loadAsync(bytes);
  const haps = Object.values(outer.files).filter(e=>!e.dir && /\.hap$/i.test(e.name));
  need(haps.length === 1,'unique_nested_hap_required');
  const inner = await JSZip.loadAsync(await haps[0].async('nodebuffer'));
  async function one(pattern, code) {
    const entries = Object.values(inner.files).filter(e=>!e.dir && pattern.test(e.name));
    need(entries.length===1,code); return entries[0].async('nodebuffer');
  }
  const app = await one(/(?:^|\/)js\/[^/]+\/app\.js$/,'unique_original_app_required');
  const page = await one(/(?:^|\/)js\/[^/]+\/pages\/phone-sync\/phone-sync\.js$/,'unique_original_page_required');
  report.app_sha256=hash(bytes); report.app_js_sha256=hash(app); report.page_js_sha256=hash(page);
  report.unique_nested_hap=true;
  // CI SHA, manifest identity/signature and latest-run linkage are parent checks.
  return {app,page};
}

function exercise(bytes, report) {
  const clock = makeHostClock(), definitions=[], rows=[], keep=[], originals={};
  let app, page, listener, sendFail=false, fetches=0, reads=0, unsubscribes=0;
  for (const level of ['debug','log','info','warn','error']) originals[level]=()=>{};
  const hostConsole={...originals};
  const status=()=>app._elctonLogStatus.call(app);
  function drain() {
    for (let i=0; status().pending && i<24; i++) {
      const t=[...clock.timers.values()].filter(t=>t.delay<=5000).sort((a,b)=>a.due-b.due || a.id-b.id)[0];
      need(t,'logger_drain_timer_missing'); clock.fire(t.id);
    }
    need(!status().pending && !status().busy && !status().dropped && !status().failed,'logger_bounded_drain');
  }
  const checkpoint=()=>{ if(app && status().pending>=6) drain(); };
  const contract={sdk_version_request:null,version_complete:null,registration_success:false,message_success:false,send_success:false,send_fail_numeric_zero:false};
  const engine={
    getWearEngineVersion(o){need(o.sdkVersion==='3' && typeof o.complete==='function','host_version_callback_contract');contract.sdk_version_request=o.sdkVersion;checkpoint();contract.version_complete='5.0.0.401';o.complete(contract.version_complete);checkpoint();},
    setPackageName(o){need(typeof o.appName==='string' && o.appName.length>0 && typeof o.complete==='function','host_package_callback_contract');checkpoint();o.complete();checkpoint();},
    setFingerprint(o){need(typeof o.appName==='string' && typeof o.appCert==='string' && /^[a-fA-F0-9]{64}$/.test(o.appCert) && typeof o.complete==='function','host_certificate_callback_contract');checkpoint();o.complete();checkpoint();},
    subscribeMsg(o){need(typeof o.success==='function' && typeof o.fail==='function','host_registration_callback_contract');listener=o.success;checkpoint();contract.registration_success=true;o.success({isRegister:true});checkpoint();},
    unsubscribeMsg(){unsubscribes++;listener=null;},
    sendMsg(o){need(o.deviceId==='remote' && typeof o.bundleName==='string' && o.abilityName==='' && typeof o.message==='string' && typeof o.success==='function' && typeof o.fail==='function','host_send_callback_contract');checkpoint();if(sendFail){contract.send_fail_numeric_zero=true;o.fail(210301031,0);}else{contract.send_success=true;o.success();}checkpoint();}
  };
  const native={
    'system.configuration':{},
    'system.device':{getInfo(o){o.success({brand:'HOST',model:'HOST_NOT_FIT3',windowWidth:412,windowHeight:484});}},
    'system.router':{getParams(){return {};},replace(){throw new HostError('unexpected_host_navigation');}},
    'system.file':{get(o){reads++;o.fail(null,301);},readText(){throw new HostError('unexpected_host_read_text');},writeText(){throw new HostError('unexpected_host_file_write');}},
    'system.storage':{get(o){if(o.success)o.success('');},set(){throw new HostError('unexpected_host_storage_write');}},
    'system.wearengine':engine,
    'system.brightness':{setKeepScreenOn(o){need(typeof o.keepScreenOn==='boolean','awake_boolean');keep.push(o.keepScreenOn);o.success();}},
    'system.fetch':{fetch(o){
      need(o.method==='POST' && typeof o.data==='string','host_logger_request_contract');
      const body=JSON.parse(o.data);need(Array.isArray(body.logs) && body.logs.length<=8,'logger_batch_bound');
      for(const r of body.logs) rows.push({tag:r.tag,msg:r.msg});
      fetches++; report.adapter_ack_not_real=true;
      o.success({code:200,data:'{"ok":true}'});
    }}
  };
  function nativeRequire(name){const normalized=name.replace(/^@/,'');need(Object.hasOwn(native,normalized),'unmodelled_native_module');return native[normalized];}
  function ViewModel(def){definitions.push(def);Object.assign(this,def.data||{},def);this.data=def.data||def;}
  class HostDate extends Date {constructor(...args){super(...(args.length?args:[clock.now()]));}static now(){return clock.now();}}
  const context=vm.createContext({ViewModel,console:hostConsole,requireNative:nativeRequire,require:nativeRequire,
    setTimeout:(fn,ms)=>clock.set(fn,ms),clearTimeout:clock.clear,
    setInterval:(fn,ms)=>clock.set(fn,ms,true),clearInterval:clock.clear,Date:HostDate},
    {name:'ORIGINAL_BYTES_HOST_NOT_NATIVE',codeGeneration:{strings:false,wasm:false}});
  function execute(b,name){
    need(b.length>0 && b.length<2*1024*1024,'compiled_byte_bound');
    const text=b.toString('utf8');need(Buffer.from(text).equals(b),'original_utf8_roundtrip');
    assertCompiledSdkShape(b);
    return new vm.Script(text,{filename:name}).runInContext(context,{timeout:3000});
  }
  execute(bytes.app,'original-hap-app.js');need(definitions.length===1,'one_original_app_definition');app=definitions[0];
  need(typeof app.onCreate==='function' && typeof app.onDestroy==='function' && typeof app._elctonLogStatus==='function','original_app_bridges_required');
  context.$app={$def:app};
  try {
    app.onCreate.call(app);need(status().seq>0,'configured_logger_required');
    need(clock.timers.has(0) && clock.timers.get(0).delay===5000,'valid_zero_logger_timer');drain();
    report.original_app_bytes_executed=true;
    const result=execute(bytes.page,'original-hap-phone-sync.js');
    need(definitions.length===2,'one_original_page_definition');page=result;
    need(page && typeof page.onListen==='function' && typeof page.onDestroy==='function','original_page_lifecycle_required');
    page.onInit();need(page.ready,'host_page_device_callback_ready');page.onShow();
    need(keep.length===1 && keep[0]===true,'awake_on_actual_page_show');
    page.onListen();need(page.listening && typeof listener==='function','actual_page_registered_listener');
    drain();
    contract.message_success=true;
    listener({isRegister:false,isFileType:false,message:JSON.stringify({protocol:'elcton.sync',version:1,sender:'phone',type:'HELLO',transferId:''})});
    drain();
    need(rows.some(r=>r.tag==='WE/HELLO_RECV') && rows.some(r=>r.tag==='WE/READY_PREPARED'),'actual_page_hello_ready_logged');
    sendFail=true;
    page._channel.send({protocol:'elcton.sync',version:1,sender:'watch',type:'READY',transferId:''},()=>{});drain();
    need(rows.some(r=>r.tag==='WE/SEND_FAIL' && /arg1=210301031 arg2=0 type1=3 type2=3/.test(r.msg)),'numeric_zero_failure_actual_logger');
    // Exercise actual app-owned compat factory too. Protocol is an explicit HOST
    // identity/ASCII seam, never a replacement engine or a product source factory.
    delete engine.getWearEngineVersion;
    const compat=selectCompiledChannel(app,{noVersion:true},{phonePackage:'HOST.placeholder',phoneFingerprint:'0'.repeat(64)},
      {id:v=>typeof v==='string'&&v.length>0,hex:(v,n)=>v.length===n,ascii:JSON.stringify},engine);
    compat.open(()=>{},err=>need(!err,'original_compat_open'));checkpoint();
    compat.send({type:'READY'},()=>{});drain();compat.close();drain();
    const required=['SDK_CALL','VER_OK','PKG_CALL','PKG_OK','CERT_CALL','CERT_OK','REG_CALL','REG_OK','HELLO_RECV','READY_PREPARED','READY_CALL','READY_OK','SEND_CALL','SEND_OK','SEND_FAIL'];
    report.stages=Object.fromEntries(required.map(s=>[s,rows.some(r=>r.tag==='WE/'+s)]));
    need(Object.values(report.stages).every(Boolean),'required_actual_stage_rows_missing');
    report.original_page_bytes_executed=true; report.actual_vm_original_bytes=true;
    page.onHide();need(keep.at(-1)===false,'awake_off_actual_page_hide');
    page.onShow();page.onDestroy();need(keep.join(',')==='true,false,true,false','awake_reacquire_destroy_release');
    need(listener===null && unsubscribes>0 && !page.listening && page._channel===null && page._receiver===null && page._exporter===null && page._timer===null && !app._elctonIO.busy && !app._elctonIO.journalBusy && app._elctonIO.queue.length===0,'destroy_actual_page_resources_empty');
    report.awake_sequence=keep.slice();report.callback_contract=contract;
    report.awake_reclaimed=true;report.listener_closed=listener===null && unsubscribes>0;drain();
    app.onDestroy.call(app);need(clock.timers.size===0 && status().pending===0 && !status().busy,'destroy_live_resources_empty');
    need(Object.keys(originals).every(k=>hostConsole[k]===originals[k]),'destroy_console_restored');
    const stopped=JSON.stringify(status()), before=fetches;
    app._elctonLog.call(app,'SEND_FAIL',{code:206,arg1:210301031,arg2:0,type1:3,type2:3});hostConsole.info('HOST_POST_STOP');
    need(JSON.stringify(status())===stopped && fetches===before && clock.timers.size===0,'post_stop_no_rows_fetch_timers');
    report.post_stop_verified=true;report.timer_zero_verified=true;report.logger_status_from_actual_app=true;
    const safeRows=rows.filter(r=>/^WE\/[A-Z0-9_]+$/.test(r.tag));
    need(safeRows.every(r=>typeof r.msg==='string' && r.msg.length<=160 && /^(?:[a-z][a-z0-9]*=(?:-?\d+|true|false)(?: |$))*$/.test(r.msg)),'safe_numeric_stage_rows_only');
    report.safe_rows=safeRows;
    report.rows=report.safe_rows.length; report.host_fetches=fetches;report.empty_host_file_reads=reads;
    report.final_timers=clock.timers.size;report.passed=true;
  } finally {
    if(page)try{page.onDestroy();}catch{}
    if(app)try{app.onDestroy.call(app);}catch{}
  }
}

export async function main(argv=process.argv.slice(2)) {
  const report={passed:false,host_only:true,native:false,native_verified:false,real_https:false,real_bluetooth:false,
    adapter_ack_not_real:false,new_ci_provenance_verified:false,manifest_identity_verified:false,
    parent_provenance_check_required:true,actual_vm_original_bytes:false,original_app_bytes_executed:false,original_page_bytes_executed:false};
  let out;
  try {
    if(argv.length===1 && argv[0]==='--help'){process.stdout.write('HOST ONLY: --app actualSDK.app --report evidence/compiled-stage-actual.json; no HTTPS/native/Bluetooth; parent verifies CI+manifest+SHA\n');return report;}
    need(argv.length===4 && argv[0]==='--app' && argv[2]==='--report','cli_exact_app_report_only');
    const input=path.resolve(argv[1]);
    const candidateReportPath=path.resolve(argv[3]);
    need(candidateReportPath!==input,'report_input_collision');
    const inputRealPath=fs.realpathSync(input), inputStat=fs.statSync(input,{bigint:true});
    let reportRealPath, reportStat;
    try { reportRealPath=fs.realpathSync(candidateReportPath); reportStat=fs.statSync(candidateReportPath,{bigint:true}); }
    catch(error) { if(error.code!=='ENOENT') throw error; }
    need(reportRealPath!==inputRealPath && !(reportStat && reportStat.dev===inputStat.dev && reportStat.ino===inputStat.ino),'report_input_collision');
    // Publish a writable target only after path and existing-file identity checks.
    out=candidateReportPath;
    const bytes=await loadApp(input,report);exercise(bytes,report);
  } catch(error) {report.failure=error instanceof HostError?error.message:'host_input_or_execution_failed';}
  if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');}
  process.stdout.write(JSON.stringify({passed:report.passed,host_only:true,native:false,real_https:false,failure:report.failure})+'\n');
  if(!report.passed)process.exitCode=1;return report;
}
if(process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url) await main();
