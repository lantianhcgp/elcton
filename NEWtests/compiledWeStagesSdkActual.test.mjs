import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const JSZip=require('../tools/sign/node_modules/jszip');
const script=new URL('../qa/we-handshake-20261115/compiled-we-stages.mjs',import.meta.url);
const root=path.resolve(script.pathname,'../../..');
const input='/data/data/com.termux/files/home/lw_build/we-handshake-20261115/r3-ci-43661966735/dist/elcton-default-unsigned.app';
const evidence=path.join(root,'qa/we-handshake-20261115/evidence/r3');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const appBytes=fs.readFileSync(input);
const outer=await JSZip.loadAsync(appBytes);
const inner=await JSZip.loadAsync(await outer.file('entry-default.hap').async('nodebuffer'));
const app=await inner.file('assets/js/MainAbility/app.js').async('nodebuffer');
const page=await inner.file('assets/js/MainAbility/pages/phone-sync/phone-sync.js').async('nodebuffer');

test('NEW actual CI SDK alpha-renamed bootstrap passes exact shape; noncompiled and broken bootstraps fail (shape-only negatives)',async()=>{
  const qa=await import(script.href);
  assert.equal(typeof qa.assertCompiledSdkShape,'function','missing alpha-invariant exact SDK bootstrap validation');
  assert.doesNotThrow(()=>qa.assertCompiledSdkShape(app));
  assert.doesNotThrow(()=>qa.assertCompiledSdkShape(page));
  assert.equal(page.includes(Buffer.from('__webpack_modules__')),false,'fixture must be actual compact page');
  for(const source of [
    'new ViewModel({onListen:function(){}});',
    '(function(){var __webpack_modules__={};return new ViewModel({});})();',
    page.toString().replace('return i.exports}var r=','return {}}var r='),
    page.toString().replace('var r=__webpack_require__(627);','var r=__webpack_require__(999999);'),
    page.toString()+'\n;new ViewModel({});'
  ]) assert.throws(()=>qa.assertCompiledSdkShape(Buffer.from(source)),/compiled_sdk_shape_required/);
});

test('NEW actual CI APP original-byte VM: callback contracts, all stages and destruction (HOST NOT native)',()=>{
  const reportPath=path.join(evidence,'stage-test-actual.json');
  const result=spawnSync(process.execPath,[script.pathname,'--app',input,'--report',reportPath],{encoding:'utf8',timeout:15000});
  assert.equal(result.status,0,result.stdout+result.stderr);
  assert.equal(result.stderr,'');
  const report=JSON.parse(fs.readFileSync(reportPath));
  assert.equal(report.app_sha256,sha(appBytes));assert.equal(report.app_js_sha256,sha(app));assert.equal(report.page_js_sha256,sha(page));
  assert.equal(sha(fs.readFileSync(input)),sha(appBytes),'actual APP bytes changed');
  assert.equal(report.actual_vm_original_bytes,true);
  const required=['SDK_CALL','VER_OK','PKG_CALL','PKG_OK','CERT_CALL','CERT_OK','REG_CALL','REG_OK','HELLO_RECV','READY_PREPARED','READY_CALL','READY_OK','SEND_CALL','SEND_OK','SEND_FAIL'];
  assert.deepEqual(Object.keys(report.stages),required);assert.ok(Object.values(report.stages).every(Boolean));
  assert.deepEqual(report.awake_sequence,[true,false,true,false]);
  assert.equal(report.final_timers,0);assert.equal(report.listener_closed,true);assert.equal(report.timer_zero_verified,true);assert.equal(report.post_stop_verified,true);
  assert.equal(report.callback_contract.sdk_version_request,'3');assert.equal(report.callback_contract.version_complete,'5.0.0.401');
  assert.equal(report.callback_contract.registration_success,true);assert.equal(report.callback_contract.message_success,true);
  assert.equal(report.callback_contract.send_success,true);assert.equal(report.callback_contract.send_fail_numeric_zero,true);
  assert.equal(report.native_verified,false);assert.equal(report.real_https,false);assert.equal(report.real_bluetooth,false);
});
