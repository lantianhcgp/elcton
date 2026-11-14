// Fail-closed local tools policy; this module never connects to CDP or Huawei.
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const directory=path.dirname(fileURLToPath(import.meta.url));
const reviewedExpressions={
 'scope_health_init.js':'ffd9a32c219cc42919c97d6526bdbff4586767272035d36140572c835b72b3d6',
 'scope_grants_readonly.js':'9b6de6c58ca3598123e8945fd4f62fd9b3968e031f2b662c33b7904865495215'
};
export function expressionAllowed(file,source){
 const actual=path.resolve(file instanceof URL?fileURLToPath(file):file);
 const name=path.basename(actual);
 return actual===path.join(directory,name)&&Object.hasOwn(reviewedExpressions,name)&&
  createHash('sha256').update(source).digest('hex')===reviewedExpressions[name];
}
export function safeLocation(value){
 const u=new URL(value);return {origin:u.origin,path:u.pathname};
}
export function manualInputAllowed(method,params,state){
 if(!/^https:\/\/id[0-9]+\.cloud\.huawei\.com$/.test(state?.origin||'')||
    state?.path!=='/CAS/portal/loginAuth.html')return false;
 const box=state.captcha;
 if(!box||![box.x,box.y,box.width,box.height].every(Number.isFinite)||
    box.width<100||box.height<100||box.width>650||box.height>700)return false;
 const inside=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&
  p.x>=box.x&&p.x<=box.x+box.width&&p.y>=box.y&&p.y<=box.y+box.height;
 if(method==='Input.dispatchMouseEvent')return ['mouseMoved','mousePressed','mouseReleased'].includes(params?.type)&&inside(params);
 if(method==='Input.dispatchTouchEvent')return ['touchStart','touchMove','touchEnd','touchCancel'].includes(params?.type)&&
  Array.isArray(params.touchPoints)&&params.touchPoints.every(inside);
 return false;
}
