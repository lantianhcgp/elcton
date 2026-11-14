import fs from 'node:fs';
import {createBrowser} from '/data/data/com.termux/files/home/liubai-watch-sign-private/agc-quicklogin.cjs';
const b=await createBrowser(9233);
try{
 const all=await b.cdp.send('Network.getAllCookies');
 const cookies=all.cookies.filter(c=>['developer.huawei.com','.developer.huawei.com','.huawei.com','agc-drcn.developer.huawei.com'].includes(c.domain));
 let csrf=cookies.find(c=>/^(csrfToken|X-HD-CSRF|x-hd-csrf|csrf_token)$/.test(c.name))?.value||'';
 if(!csrf){try{const j=JSON.parse(decodeURIComponent(cookies.find(c=>c.name==='developer_userinfo')?.value||''));csrf=j.csrftoken||j.csrfToken||''}catch{}}
 const old=JSON.parse(fs.readFileSync('/data/data/com.termux/files/home/hw_watch/agc-cert/session.json','utf8'));
 const payload={fromPage:1,pageSize:40,projectIds:['101653523864732872'],projectName:'',queryFlag:1};
 const r=await fetch('https://agc-drcn.developer.huawei.com/agc/edge/cpms/project-management-service/v1/projectList',{method:'POST',redirect:'error',headers:{Accept:'application/json','Content-Type':'application/json',Origin:'https://developer.huawei.com',Referer:'https://developer.huawei.com/',Cookie:cookies.map(c=>c.name+'='+c.value).join('; '),'X-HD-CSRF':csrf,agcTeamId:old.team_id||''},body:JSON.stringify(payload),signal:AbortSignal.timeout(25000)});
 let j={};try{j=await r.json()}catch{}
 const rows=j.projectList||[],target=rows.filter(p=>String(p.projectId)==='101653523864732872');
 const apps=target.flatMap(p=>p.appList||[]).filter(a=>String(a.appId)==='118599721');
 const report={checked_at:new Date().toISOString(),app_id:'118599721',project_id:'101653523864732872',mutation_attempted:false,request:'POST projectList exact project filter (read-only)',http_status:r.status,ret_code:j.ret?.code??null,response_keys:Object.keys(j),returned_projects:rows.length,target_project_count:target.length,target_apps:apps.map(a=>({appId:a.appId,appName:a.appName,packageName:a.packageName,packageType:a.packageType})),verified:r.status===200&&String(j.ret?.code)==='0'&&target.length===1&&apps.length===1&&apps[0].packageName==='com.hcbiu.elcton'};
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await b.close()}
