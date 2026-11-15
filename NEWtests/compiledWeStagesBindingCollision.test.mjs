import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {assertCompiledSdkShape} from '../qa/we-handshake-20261115/compiled-we-stages.mjs';
const require=createRequire(import.meta.url);
const acorn=require('../tools/sign/node_modules/acorn');
const JSZip=require('../tools/sign/node_modules/jszip');
const input='/data/data/com.termux/files/home/lw_build/we-handshake-20261115/r3-ci-43661966735/dist/elcton-default-unsigned.app';
// Read public original APP only. All source-offset mutations remain in memory.
const original=fs.readFileSync(input);
const outer=await JSZip.loadAsync(original);
const inner=await JSZip.loadAsync(await outer.file('entry-default.hap').async('nodebuffer'));
const app=await inner.file('assets/js/MainAbility/app.js').async('nodebuffer');
const page=await inner.file('assets/js/MainAbility/pages/phone-sync/phone-sync.js').async('nodebuffer');
const source=page.toString('utf8');
const body=acorn.parse(source,{ecmaVersion:2020}).body[0].expression.callee.body.body;
const table=body[0].declarations[0], cache=body[1].declarations[0], loader=body[2];
const cached=loader.body.body[0].declarations[0], loaded=loader.body.body[2].declarations[0];
const invoke=loader.body.body[3].expression;
const mutate=(node,name)=>Buffer.from(source.slice(0,node.start)+name+source.slice(node.end));
const reject=bytes=>assert.throws(()=>assertCompiledSdkShape(bytes),/compiled_sdk_shape_required/);
assert.equal(table.id.name,'e'); assert.equal(cache.id.name,'t');
assert.equal(invoke.callee.object.name,table.id.name);
assert.equal(cached.init.object.name,cache.id.name);
assert.equal(source.includes('TABLE'),false); assert.equal(source.includes('CACHE'),false);

test('actual APP AST TABLE call: unbound TABLE must not equal bound e (shape only)',()=>{
  reject(mutate(invoke.callee.object,'TABLE'));
  // Other canonical roles must not collide with ordinary Identifier names either.
  reject(mutate(invoke.callee.property,'ID'));
  reject(mutate(invoke.arguments[0],'MODULE'));
  reject(mutate(loader.body.body[1].consequent.body[0].argument.object,'CACHED'));
  assert.deepEqual(fs.readFileSync(input),original);
});

test('actual APP AST cached lookup: unbound CACHE must not equal bound t (shape only)',()=>{
  reject(mutate(cached.init.object,'CACHE'));
  reject(mutate(cached.init.property,'ID'));
  assert.deepEqual(fs.readFileSync(input),original);
});

test('actual original SDK APP/page and consistent alpha-renaming remain accepted',()=>{
  assert.doesNotThrow(()=>assertCompiledSdkShape(app));
  assert.doesNotThrow(()=>assertCompiledSdkShape(page));
  const edits=[];
  const renamed=new Map([[loader.params[0].name,'exports'],[cached.id.name,'TABLE'],[loaded.id.name,'CACHE']]);
  function walk(node,parent,key){
    if(!node || typeof node!=='object')return;
    if(node.type==='Identifier' && renamed.has(node.name) &&
      !(parent?.type==='MemberExpression' && key==='property' && !parent.computed) &&
      !(parent?.type==='Property' && key==='key' && !parent.computed))edits.push([node.start,node.end,renamed.get(node.name)]);
    for(const [k,v] of Object.entries(node))if(Array.isArray(v))v.forEach(n=>walk(n,node,k));else if(v && typeof v==='object')walk(v,node,k);
  }
  // Positive: a parameter named exports must not rewrite .exports properties.
  walk(loader,null,null);
  let alpha=source;
  for(const [start,end,name] of edits.sort((a,b)=>b[0]-a[0]))alpha=alpha.slice(0,start)+name+alpha.slice(end);
  assert.doesNotThrow(()=>assertCompiledSdkShape(Buffer.from(alpha)));
  assert.deepEqual(fs.readFileSync(input),original);
});
