// Candidate RED contract, isolated from product tests.
// Raw first-argument diagnostic MUST NOT vanish merely because second arg is 0.
// This does NOT claim a real watch emits data=16; it models that possible shape.
// It executes exact baseline 83d58a8, never current parent edits or device APIs.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
test('candidate RED: fail(16, 0) remains failure AND retains first-argument diagnostic',()=>{
  const source=execFileSync('git',['show','83d58a8:entry/src/main/js/MainAbility/common/wearService.js'],{cwd:root,encoding:'utf8'});
  const factory=vm.runInNewContext(source.replace('export default service;','service;'),{console:{info(){}}});
  const engine={
    getWearEngineVersion:p=>p.complete('5.0.2.401'),
    setPackageName:p=>p.complete(),setFingerprint:p=>p.complete(),
    unsubscribeMsg(){},subscribeMsg:p=>p.success({isRegister:true}),
    sendMsg:p=>p.fail(16,0)
  };
  const channel=factory({phonePackage:'org.example.fixture',phoneFingerprint:'a'.repeat(64)},{id:()=>true,hex:()=>true,ascii:JSON.stringify},engine);
  channel.open(()=>{},error=>assert.equal(error,null));
  let result;channel.send({sender:'watch',type:'READY'},error=>result=error);
  assert.ok(result,'native fail must never become success');
  // Result format for a future fix is intentionally not prescribed.
  // Baseline fails here with SEND_0: both raw arguments are no longer recoverable.
  assert.match(JSON.stringify(result),/16/,'bounded diagnostics must preserve raw first arg; actual='+result);
});
