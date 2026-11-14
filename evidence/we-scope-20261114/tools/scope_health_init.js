(async()=>{
 if(location.hostname!=='developer.huawei.com')return {verified:false,reason:'login_challenge_not_completed',mutation_attempted:false};
 const h={'Content-Type':'application/json;charset=UTF-8','x-developerId':sessionStorage.getItem('x-uid')||'','x-alliances-service':'1062'};
 if(sessionStorage.getItem('healthkit_csrf'))h.csrftoken=sessionStorage.getItem('healthkit_csrf');
 const r=await fetch('https://svc-drcn.developer.huawei.com/svc/healthkit/healthkit/Common/v2/getUserBriefInfo',{method:'POST',redirect:'error',credentials:'include',headers:h,body:'{}'});
 const j=await r.json(),csrf=r.headers.get('csrftoken');if(csrf&&j.resultCode===0)sessionStorage.setItem('healthkit_csrf',csrf);
 return {checked_at:new Date().toISOString(),http_status:r.status,resultCode:j.resultCode,csrf_initialized:!!sessionStorage.getItem('healthkit_csrf'),developer_present:!!sessionStorage.getItem('x-uid'),verified:r.status===200&&j.resultCode===0,mutation_attempted:false};
})()
