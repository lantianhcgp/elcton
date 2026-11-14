// READ-ONLY research fixture. Executes pinned 83d58a8 source and the SHA-verified
// Huawei 5.0.2.306 JS wrapper with explicit callbacks. NOT native/BT/device evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../../..');
const base='83d58a8';
const prefix='entry/src/main/js/MainAbility/';
const observations=[];
function source(name){return execFileSync('git',['show',base+':'+prefix+name],{cwd:root,encoding:'utf8'});}
function sdk(engine,legacy){
  const text=fs.readFileSync(path.join(here,'official-sdk-5.0.2.306.source.txt'),'utf8')
    .replace('import wearengine from "@system.wearengine";','var wearengine=__engine;')
    .replace('export { P2pClient, Message, Builder, PeerDeviceClient };','globalThis.__sdk={P2pClient,Message,Builder,PeerDeviceClient};');
  const context={__engine:engine,FeatureAbility:legacy,console:{info(){},error(){}}};
  vm.runInNewContext(text,context,{filename:'SHA-verified Huawei wearengine.js'});
  return context.__sdk;
}
const identity={phonePackage:'org.example.fixture',phoneFingerprint:'a'.repeat(64)};
const packet={protocol:'elcton.sync',version:1,sender:'watch',type:'READY',transferId:''};
const ascii=x=>JSON.stringify(x);
const protocol={ascii,id:x=>!!x,hex:x=>!!x};
function createService(version='5.0.2.401',options={}){
  const calls=[];let inbox,pending;
  const modern={
    getWearEngineVersion(p){calls.push('query:'+p.sdkVersion);if(options.pending)pending=p.complete;else p.complete(version);},
    setPackageName(p){calls.push('pkg');p.complete();},
    setFingerprint(p){calls.push('cert');p.complete();},
    unsubscribeMsg(){calls.push('modern:unsub');},
    subscribeMsg(p){calls.push('modern:sub');inbox=p;if(!options.noRegistration)p.success({isRegister:true});},
    sendMsg(p){calls.push('modern:send');if(options.send)options.send(p);else p.success();}
  };
  const legacy={
    unsubscribeMsg(){calls.push('legacy:unsub');},
    subscribeMsg(p){calls.push('legacy:sub');inbox=p;if(!options.noRegistration)p.success({isRegister:true});},
    sendMsg(p){calls.push('legacy:send');if(options.send)options.send(p);else p.success();}
  };
  const factory=vm.runInNewContext(source('common/wearService.js').replace('export default service;','service;'),{console:{info(){}},FeatureAbility:legacy});
  return {channel:factory(identity,protocol,modern),calls,modern,legacy,get inbox(){return inbox;},settle(){pending(version);}};
}
function configureSdk(version,busMode='modern'){
  const calls=[];let send,inbox;
  const bus={unsubscribeMsg(){calls.push(busMode+':unsub');},subscribeMsg(p){calls.push(busMode+':sub');inbox=p;},sendMsg(p){calls.push(busMode+':send');send=p;}};
  const engine={getWearEngineVersion(p){assert.equal(p.sdkVersion,'3');calls.push('query:3');p.complete(version);},setPackageName(p){calls.push('pkg');p.complete();},setFingerprint(p){calls.push('cert');p.complete();},...(busMode==='modern'?bus:{})};
  const library=sdk(engine,busMode==='legacy'?bus:undefined);
  const client=new library.P2pClient();client.setPeerPkgName(identity.phonePackage);client.setPeerFingerPrint(identity.phoneFingerprint);
  return {client,library,calls,get send(){return send;},get inbox(){return inbox;}};
}
function sdkSend(x){
  const builder=new x.library.Builder();builder.setDescription('credential-free test READY');
  const message=new x.library.Message();message.builder=builder;
  const events=[];x.client.send(message,{onSuccess(){events.push(['success']);},onFailure(){events.push(['failure']);},onSendResult(result){events.push(['result',result]);},onSendProgress(value){events.push(['progress',value]);}});
  return events;
}
test('official wrapper: fail(data,code), including 0 or omitted, always maps to 206 and preserves first data',()=>{
  const vectors=[['literal-zero', 'native diagnostic',0],['missing-second', 'native diagnostic',undefined],['numeric-first',16,0],['string-first','206',0],['object-first',{code:16,message:'fixture disconnected'},0],['second-206','native diagnostic',206],['both-missing',undefined,undefined]];
  for(const [id,data,code] of vectors){
    const x=configureSdk('5.0.2.401');const events=sdkSend(x);x.send.fail(data,code);
    assert.deepEqual(events.map(e=>e[0]),['failure','result','progress']);
    assert.equal(events[1][1].code,206);assert.equal(events[1][1].data,data);assert.equal(events[2][1],'0%');
    observations.push({test:'official-fail',id,nativeData:data,nativeCode:code,canonicalCode:events[1][1].code,dataRetained:events[1][1].data===data});
  }
});
test('official wrapper: success callback, not numeric code 0, maps to 207',()=>{
  const x=configureSdk('5.0.2.401');const events=sdkSend(x);x.send.success();
  assert.deepEqual(events.map(e=>e[0]),['success','result','progress']);assert.equal(events[1][1].code,207);assert.equal(events[2][1],'100%');
});
test('pinned adapter: SEND_0 conflates literal 0, missing/string/object second parameters and discards first data',()=>{
  const vectors=[['literal-zero',16,0],['missing-second','206',undefined],['string-second','diagnostic','206'],['object-second','diagnostic',{code:206}],['second-206','diagnostic',206]];
  for(const [id,data,code] of vectors){
    const x=createService('5.0.2.401',{send:p=>p.fail(data,code)});let openError,sendError;
    x.channel.open(()=>{},e=>openError=e);assert.equal(openError,null);x.channel.send(packet,e=>sendError=e);
    assert.equal(sendError,code===206?'SEND_206':'SEND_0');assert.equal(x.channel.isNegotiated(),true);
    observations.push({test:'baseline-fail',id,nativeData:data,nativeCode:code,reported:sendError,registeredAfterSendFailure:x.channel.isNegotiated()});
  }
});
test('official dispatch: 401 modern vs 303/302 FeatureAbility, pkg threshold 303, cert threshold 302',()=>{
  for(const [version,busMode,want] of [['5.0.2.401','modern',['query:3','pkg','cert','pkg','modern:unsub','modern:sub','modern:send']],['5.0.2.303','legacy',['query:3','pkg','cert','pkg','legacy:sub','legacy:send']],['5.0.2.302','legacy',['query:3','cert','legacy:sub','legacy:send']]]){
    const x=configureSdk(version,busMode);x.client.registerReceiver({onSuccess(){},onFailure(){},onReceiveMessage(){}});sdkSend(x);
    assert.deepEqual(x.calls,want);observations.push({test:'official-dispatch',version,calls:x.calls});
  }
});
test('official registration: absent/null data or isRegister => onSuccess; message => receive; fail args forwarded unchanged',()=>{
  const x=configureSdk('5.0.2.401');const events=[];
  x.client.registerReceiver({onSuccess(){events.push(['registered']);},onFailure(...args){events.push(['failed',...args]);},onReceiveMessage(data){events.push(['message',data]);}});
  x.inbox.success();x.inbox.success(null);x.inbox.success({isRegister:true});x.inbox.success({isRegister:false,message:'HELLO fixture'});x.inbox.fail(16,0);
  assert.deepEqual(events.slice(0,3).map(e=>e[0]),['registered','registered','registered']);
  assert.deepEqual(events[3],['message','HELLO fixture']);assert.deepEqual(events[4],['failed',16,0]);
  observations.push({test:'official-registration',events});
});
test('baseline registration waits for event, stays closed on pre-registration message, ignores stale callbacks',()=>{
  const x=createService('5.0.2.401',{noRegistration:true});let opened=0,received=0;
  x.channel.open(()=>received++,e=>{assert.equal(e,null);opened++;});
  x.inbox.success({message:'{"sender":"phone","type":"HELLO"}'});assert.equal(opened,0);assert.equal(received,0);
  let err;x.channel.send(packet,e=>err=e);assert.equal(err,'CHANNEL_CLOSED_OR_TOO_LARGE');
  x.inbox.success();assert.equal(opened,1);assert.equal(x.channel.isNegotiated(),true);
  x.channel.close();x.inbox.success({message:'{"sender":"phone","type":"HELLO"}'});assert.equal(received,0);
});
test('version semantics: baseline waits for complete and adds exact-four-fields restriction absent from wrapper',()=>{
  const pending=createService('5.0.2.303',{pending:true});let opened=0;
  pending.channel.open(()=>{},e=>{assert.equal(e,null);opened++;});assert.deepEqual(pending.calls,['query:3']);assert.equal(opened,0);
  pending.settle();assert.equal(opened,1);assert.deepEqual(pending.calls,['query:3','pkg','cert','legacy:sub']);
  const x=configureSdk('3.401');assert.equal(x.client.version,'401');sdkSend(x);assert.equal(x.calls.at(-1),'modern:send');
  const y=createService('3.401');let error;y.channel.open(()=>{},e=>error=e);assert.equal(error,'VERSION_UNSUPPORTED');
  observations.push({test:'version-shape',input:'3.401',officialVersion:x.client.version,baselineError:error,physicalVersionShape:'UNKNOWN'});
});
test('no version API selects UNVERSIONED direct engine even with FeatureAbility supplied; no proof actual device uses it',()=>{
  const seen=[];const engine={setPackageName:p=>p.complete(),setFingerprint:p=>p.complete(),subscribeMsg:p=>p.success({isRegister:true}),unsubscribeMsg(){},sendMsg:p=>{seen.push('engine');p.fail('fixture',0);}};
  const text=source('common/wearChannel.js').replace("import engine from '@system.wearengine';",'var engine=__engine;').replace("import protocol from './wearProtocol.js';",'var protocol=__protocol;').replace('export default channel;','channel;');
  const factory=vm.runInNewContext(text,{__engine:engine,__protocol:protocol,FeatureAbility:{sendMsg(){seen.push('legacy');}}});
  const c=factory(identity);c.open(()=>{},e=>assert.equal(e,null));assert.equal(c.summary(),'UNVERSIONED');assert.equal(c.isNegotiated(),false);
  let error;c.send(packet,e=>error=e);assert.equal(error,'SEND_0');assert.deepEqual(seen,['engine']);
});
test('page presentation: immediate proactive READY fail overwrites SDK/REG summary; no inbound HELLO needed',()=>{
  // Execute exact baseline reply method, not a substitute implementation.
  const specification=source('pages/phone-sync/phone-sync.js').replace(/^import[^\n]*\n/gm,'').replace('export default {','({').replace(/};\s*$/,'});');
  const pageMethods=vm.runInNewContext(specification,{});
  const x=createService('5.0.2.401',{send:p=>p.fail(16,0)});const page={_gen:1,_closed:false,_channel:x.channel};
  x.channel.open(()=>{throw Error('No inbound message is injected');},e=>{
    assert.equal(e,null);page.detail=x.channel.summary();assert.match(page.detail,/SDK401.*REG/);
    const before=page.detail;pageMethods.reply.call(page,packet);
    assert.equal(page.detail,'回执失败 SEND_0');assert.equal(x.channel.isNegotiated(),true);
    observations.push({test:'summary-overwrite',before,after:page.detail,inboundHelloInjected:false,stillRegistered:true});
  });
});
test('persist credential-free observations only inside allowed research directory',()=>{
  const report={scope:'Node callback fixture against pinned 83d58a8 and authentic Huawei JS wrapper; no physical native/BT test.',baseline:base,node:process.version,observations};
  fs.writeFileSync(path.join(here,'sdk-contract-observations.json'),JSON.stringify(report,null,2)+'\n');
  console.log('RESEARCH_OBSERVATIONS='+observations.length+'; native fail argument values remain UNKNOWN on device.');
});
