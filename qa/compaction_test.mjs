// Host-only guard: formatting must preserve values and public identifiers.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {minify} from '../tools/sign/node_modules/terser/main.js';
const source='(function(){var exports={};exports.revision=12;exports.message="语文";exports.calc=function(input){return input+7};return exports;})()';
const result=await minify(source,{compress:false,mangle:false,ecma:5,format:{comments:false,ascii_only:true}});
const original=vm.runInNewContext(source);
const compact=vm.runInNewContext(result.code);
assert.equal(compact.revision,original.revision);
assert.equal(compact.message,original.message);
assert.equal(compact.calc(5),original.calc(5));
assert.ok(result.code.includes('revision')&&result.code.includes('message')&&result.code.includes('calc'));
console.log('format-only compaction equivalence: PASS');
