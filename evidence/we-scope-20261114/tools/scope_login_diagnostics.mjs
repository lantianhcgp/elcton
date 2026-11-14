import fs from 'node:fs';
import {createBrowser} from '/data/data/com.termux/files/home/liubai-watch-sign-private/agc-quicklogin.cjs';
const b=await createBrowser(9233);
try{
 const state=await b.inspect();
 let page=null;
 if(/^https:\/\/id[0-9]+\.cloud\.huawei\.com$/.test(state.origin)){
  const c=JSON.parse(fs.readFileSync('/data/data/com.termux/files/home/.hermes/secrets/huawei_cred.json','utf8'));
  page=await b.cdp.call(function(phone,pw){
   let text=document.body?.innerText||'';
   for(const secret of [phone,pw])if(secret)text=text.split(secret).join('[redacted]');
   text=text.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,'[email-redacted]').replace(/\d{5,}/g,'[number-redacted]');
   return {text:text.slice(0,600),hasVisibleCaptcha:[...document.querySelectorAll('[class*=yidun],[class*=captcha]')].some(e=>e.getClientRects().length&&getComputedStyle(e).display!=='none'),errorHints:['网络异常','操作频繁','安全验证','验证失败','密码错误','登录失败','请重新登录','当前页面已过期'].filter(x=>(document.body?.innerText||'').includes(x))};
  },[c.phone,c.pw]);c.phone='';c.pw='';
 }
 const out={checked_at:new Date().toISOString(),app_id:'118599721',mutation_attempted:false,state,page};
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out,null,2));
}finally{await b.close()}
