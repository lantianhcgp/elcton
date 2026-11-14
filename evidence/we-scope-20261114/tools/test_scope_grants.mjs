// LOCAL FIXTURES ONLY. These tests cannot authenticate or prove live Scope approval.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./scope_grants_readonly.js',import.meta.url),'utf8');
const fixture=()=>({resultCode:0,totalCount:1,retCount:1,appAbsList:[{
 prodID:'118599721',prodName:'hc课程表',packageName:'com.hcbiu.elcton',prodType:1,
 serviceSingle:{serviceItem:1062,prodID:'118599721',prodType:1,openState:3,
  serviceAttrs:JSON.stringify({powerList:['com.huawei.hiwear.devicemanager'],
   inAuditPowerList:[],passedPowerList:['com.huawei.hiwear.devicemanager'],
   betaPowerList:[],approveStatus:'LOCAL_FIXTURE_UNKNOWN_ENUM',stateRange:['LOCAL_FIXTURE']})}
}]});
async function run(body,{host='developer.huawei.com',status=200}={}){
 let calls=0;
 const context=vm.createContext({location:{hostname:host},sessionStorage:{getItem:()=>'',setItem:()=>{}},
  fetch:async(url,options)=>{
   calls++;
   assert.equal(url,'https://svc-drcn.developer.huawei.com/svc/healthkit/healthkit/Common/v2/getAppAbsListByService');
   assert.equal(options.method,'POST');assert.equal(options.redirect,'error');
   assert.equal(options.headers['x-alliances-service'],'1062');
   assert.equal(JSON.parse(options.body).prodID,'118599721');
   return {status,headers:{get:()=>null},json:async()=>body};
  }});
 const output=await vm.runInContext(source,context,{timeout:2000});
 return {output:JSON.parse(JSON.stringify(output)),calls};
}
let count=0;
const outside=await run(fixture(),{host:'id5.cloud.huawei.com'});
assert.equal(outside.output.verified,false);assert.equal(outside.calls,0);count++;
const ok=await run(fixture());assert.equal(ok.output.verified,true);
assert.equal(ok.output.mutation_attempted,false);
assert.equal(ok.output.authorization.approveStatus,'LOCAL_FIXTURE_UNKNOWN_ENUM');
assert.deepEqual(ok.output.authorization.stateRange,['LOCAL_FIXTURE']);count++;
for(const [name,change] of [
 ['semantic-auth-failure',x=>{x.resultCode=1004}],
 ['total-mismatch',x=>{x.totalCount=2}],
 ['return-count-mismatch',x=>{x.retCount=2}],
 ['wrong-app',x=>{x.appAbsList[0].prodID='118599722'}],
 ['wrong-package',x=>{x.appAbsList[0].packageName='not.target'}],
 ['wrong-service',x=>{x.appAbsList[0].serviceSingle.serviceItem=32}],
 ['wrong-service-app',x=>{x.appAbsList[0].serviceSingle.prodID='118599722'}],
 ['wrong-product-type',x=>{x.appAbsList[0].prodType=7}],
 ['duplicate-target',x=>{x.appAbsList.push(structuredClone(x.appAbsList[0]));x.retCount=2;x.totalCount=2}]
]){
 const value=fixture();change(value);const result=await run(value);
 assert.equal(result.output.verified,false,name);count++;
}
assert.equal((await run(fixture(),{status:401})).output.verified,false);count++;
const result={kind:'LOCAL_FIXTURE_TESTS_NOT_LIVE_PROOF',tests:count,passed:true,
 live_scope_verified:false,live_mutation_attempted:false,checked_at:new Date().toISOString()};
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
