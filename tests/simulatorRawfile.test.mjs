import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('../elcton-sim-qa/js/runtime/deviceFeature_virtualFS.js','utf8');
test('hmlwsim reads rawfile assets as text at the runtime URI instead of base64',()=>{
 const data=new Map(); const localStorage={length:0,setItem(k,v){data.set(k,v)},getItem(k){return data.get(k)},removeItem(k){data.delete(k)},key(){return null}};
 const c=vm.createContext({Map,TextEncoder,TextDecoder,ArrayBuffer,Uint8Array,Object,localStorage,btoa:s=>Buffer.from(s,'binary').toString('base64')});
 const vfs=vm.runInContext(source+'\nDeviceFeatureVirtualFS;',c);
 vfs.setBundleName('com.hcbiu.elcton');
 const text='{"courses":[{"name":"语文"}]}';
 vfs.importFiles({'assets/entry/resources/rawfile/seed-schedule.json':new TextEncoder().encode(text).buffer},'com.hcbiu.elcton');
 let saved;vfs.readText('internal://app/rawfile/seed-schedule.json',{success:r=>saved=r.text});
 assert.equal(saved,text);
});
