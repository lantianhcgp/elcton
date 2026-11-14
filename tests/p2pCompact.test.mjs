import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {options,compact} from '../scripts/p2p_alpha_compact.mjs';

test('single-page alpha rename preserves public fields, lexical free globals and callback receiver/count',async()=>{
  const source=`(function(){var exports={};exports.open=function(openCallback){var longLocalName=13;var callbackCount=0;function namedReply(data){callbackCount++;openCallback(data);return this;}exports.reply=namedReply;exports.data={protocol:'elcton.sync',status:'READY'};exports.read=function(){return [longLocalName,callbackCount,$app.tag,FeatureAbility.tag,typeof exports.reply]};return exports;};return exports;})()`;
  const {code,map}=await compact(source,'phone-sync.js');
  const left=vm.runInNewContext(source,{$app:{tag:'app'},FeatureAbility:{tag:'legacy'}});
  const right=vm.runInNewContext(code,{$app:{tag:'app'},FeatureAbility:{tag:'legacy'}});
  const l=[],r=[];left.open(x=>l.push(x));right.open(x=>r.push(x));
  assert.equal(left.reply.name,right.reply.name);
  assert.equal(left.reply('hello'),left);assert.equal(right.reply('hello'),right);
  assert.deepEqual(l,r);assert.deepEqual(JSON.parse(JSON.stringify(left.read())),JSON.parse(JSON.stringify(right.read())));
  assert.deepEqual(Object.keys(left).sort(),Object.keys(right).sort());
  assert.deepEqual(JSON.parse(JSON.stringify(left.data)),JSON.parse(JSON.stringify(right.data)));
  assert.ok(code.includes('$app')&&code.includes('FeatureAbility')&&code.includes('namedReply'));
  assert.ok(JSON.parse(map).sourcesContent[0].includes(source));
  assert.equal(options.compress,false);assert.equal(options.mangle.toplevel,false);assert.equal(options.mangle.properties,undefined);
});

test('version-only candidate gate retains every frozen install34 assertion',()=>{
  const base=fs.readFileSync(new URL('../qa/install34/final_gate.py',import.meta.url),'utf8');
  const candidate=fs.readFileSync(new URL('../qa/p2p-ready-20261114/final_gate.py',import.meta.url),'utf8');
  assert.equal(candidate,base.replace("{'code':1000117, 'name':'1.1.14'}","{'code':1000118, 'name':'1.1.15'}"));
});
