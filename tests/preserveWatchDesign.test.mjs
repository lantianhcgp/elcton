import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {loader} from './loadSource.mjs';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const root='entry/src/main/js/MainAbility';
// Last pre-sync design, pinned rather than following a moving branch.
const baseline='9df5c2fd0b51053ac0ad32e42d3c2f3cf5b6f510';
const originalPages=['index','week','detail','code','sync'];
for(const name of originalPages){
 for(const extension of ['hml','css']){
  test(`${name}.${extension} preserves the original watch design byte for byte`,()=>{
   const relative=`${root}/pages/${name}/${name}.${extension}`;
   const original=execFileSync('git',['show',`${baseline}:${relative}`],{cwd:repo});
   assert.deepEqual(fs.readFileSync(path.join(repo,relative)),original,
    'Phone sync must not redesign this original page');
  });
 }
 test(`${name} no longer drives a cross-page redesign or device layout query`,()=>{
  const source=fs.readFileSync(path.join(repo,root,'pages',name,`${name}.js`),'utf8');
  assert.doesNotMatch(source,/common\/watchUi\.js|ui\.init\(|@system\.device/);
 });
}

test('new phone-sync layout remains isolated to its own registered page',()=>{
 const config=JSON.parse(fs.readFileSync(path.join(repo,'entry/src/main/config.json'),'utf8'));
 assert.ok(config.module.js[0].pages.includes('pages/phone-sync/phone-sync'));
 const source=fs.readFileSync(path.join(repo,root,'pages/phone-sync/phone-sync.js'),'utf8');
 assert.match(source,/@system\.device/);
 assert.match(source,/common\/wearLayout\.js/);
});

function pickupPage(){
 const routes=[],requests=[];
 let source=fs.readFileSync(path.join(repo,root,'pages/sync/sync.js'),'utf8');
 source=source.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g,
  (_,name,ref)=>`var ${name}=deps[${JSON.stringify(ref)}];`).replace('export default ','return ');
 const deps={
  '../../common/router.js':{push(p){routes.push(p.uri);},back(){routes.push('back');}},
  '../../common/data.js':{getDoc(cb){cb({rev:1,courses:[]});},clearCache(){}},
  '../../common/fs.js':{readFile(uri,cb){cb(301,'');}},
  '../../common/wearProtocol.js':loader()('common/wearProtocol.js'),
  '../../common/watchUi.js':{init(){}}
 };
 const fetchApi={fetch(p){requests.push(p);}};
 const spec=Function('deps','require','setTimeout','clearTimeout',source)(deps,
  ref=>{assert.equal(ref,'@system.fetch');return fetchApi;},()=>1,()=>{});
 const page={...spec,...structuredClone(spec.data)};delete page.data;page.onInit();
 return {page,routes,requests};
}

test('the original pickup page adds only one phone-sync row, keeping its four actions ordered',()=>{
 const {page}=pickupPage();
 assert.deepEqual(page.rows.map(r=>r.name),['本地课表','云端课表','取件码','连通自检','手机同步']);
 page.onHide();
});
test('phone-sync row cancels a pending health probe before opening the separate page',()=>{
 const {page,routes}=pickupPage();assert.equal(page.mode,'health');
 const oldGen=page.gen;page.onRowClick(4);
 assert.deepEqual(routes,['pages/phone-sync/phone-sync']);
 assert.equal(page.dead,true);assert.ok(page.gen>oldGen);
 assert.equal(page.running,false);assert.equal(page.reqTimer,null);
});
test('phone-sync row cannot supersede an in-flight import commit',()=>{
 const {page,routes}=pickupPage();page.running=true;page.committing=true;page.mode='pull';
 page.onRowClick(4);assert.deepEqual(routes,[]);assert.equal(page.dead,false);page.onHide();
});
