(async()=>{
 if(location.hostname!=='developer.huawei.com')return {verified:false,reason:'login_challenge_not_completed',mutation_attempted:false};
 const h={'Content-Type':'application/json;charset=UTF-8','x-developerId':sessionStorage.getItem('x-uid')||'','x-alliances-service':'1062','csrftoken':sessionStorage.getItem('healthkit_csrf')||''};
 const r=await fetch('https://svc-drcn.developer.huawei.com/svc/healthkit/healthkit/Common/v2/getAppAbsListByService',{method:'POST',redirect:'error',credentials:'include',headers:h,body:JSON.stringify({fromRecCount:1,maxReqCount:50,prodID:'118599721',sortType:1})});
 const j=await r.json(),csrf=r.headers.get('csrftoken');if(csrf&&j.resultCode===0)sessionStorage.setItem('healthkit_csrf',csrf);
 const rows=j.appAbsList||[],matches=rows.filter(x=>String(x.prodID)==='118599721'&&x.packageName==='com.hcbiu.elcton');
 const output={checked_at:new Date().toISOString(),app_id:'118599721',project_id:'101653523864732872',http_status:r.status,resultCode:j.resultCode,totalCount:j.totalCount??null,retCount:j.retCount??null,enumerated_count:rows.length,exact_match_count:matches.length,mutation_attempted:false,verified:r.status===200&&j.resultCode===0&&Number(j.totalCount)===rows.length&&Number(j.retCount)===rows.length&&matches.length===1};
 if(!output.verified)return output;
 const a=matches[0],s=a.serviceSingle||{};
 if(Number(a.prodType)!==1||Number(s.serviceItem)!==1062||String(s.prodID)!=='118599721'||Number(s.prodType)!==1){output.verified=false;output.reason='service_identity_mismatch';return output}
 const attrs=typeof s.serviceAttrs==='string'?JSON.parse(s.serviceAttrs):s.serviceAttrs||{};
 output.identity={name:a.prodName,app_id:String(a.prodID),packageName:a.packageName,prodType:a.prodType};
 output.service={serviceItem:s.serviceItem,openState:s.openState,serviceState:s.serviceState,createTime:s.createTime,updateTime:s.updateTime,prodID:s.prodID,prodType:s.prodType};
 output.attrs_keys=Object.keys(attrs);output.authorization={};
 for(const k of ['approveStatus','powerList','inAuditPowerList','passedPowerList','betaPowerList','stateRange','isCompatible','compatibleApp','compatiblePackageName'])output.authorization[k]=attrs[k]??null;
 const info=attrs.wearEngineBasicInfo||{};output.wearEngineBasicInfo={deviceType:info.deviceType??null,hasWearApp:info.hasWearApp??null};
 return output;
})()
