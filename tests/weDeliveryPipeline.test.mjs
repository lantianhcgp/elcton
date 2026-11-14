import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {loader} from './loadSource.mjs';
const read = n => fs.readFileSync(new URL('../'+n, import.meta.url), 'utf8');

test('new delivery gate preserves every installed-package assertion with only candidate version changed', () => {
  const source=read('qa/install34/final_gate.py');
  const old=read('qa/p2p-ready-20261114/final_gate.py');
  const candidate=read('qa/we-handshake-20261115/final_gate.py');
  assert.equal(old,source.replace("{'code':1000117, 'name':'1.1.14'}","{'code':1000118, 'name':'1.1.15'}"));
  assert.equal(candidate,source.replace("{'code':1000117, 'name':'1.1.14'}","{'code':1000119, 'name':'1.1.16'}"));
  assert.deepEqual(JSON.parse(read('entry/src/main/config.json')).app.version,{code:1000119,name:'1.1.16'});
});

test('fresh public CI tests disabled then prepares public-only logger before SDK without live logger secrets', () => {
  const ci=read('.github/workflows/wearengine.yml');
  assert.ok(ci.includes('fix/we-handshake-logger-20261115'));
  const disabled=ci.indexOf('python3 scripts/prepare_we_logger.py . --mode disabled');
  const tests=ci.indexOf('node --experimental-default-type=module --test tests/*.test.mjs');
  const preserved=ci.indexOf('mv entry/src/main/js/MainAbility/common/log-config.js build/we-logger-disabled-config.source.txt');
  const prepare=ci.indexOf('python3 scripts/prepare_we_logger.py . --mode public-build');
  const sdk=ci.indexOf('hvigorw assembleApp');
  assert.ok(disabled >= 0 && disabled < tests && tests < preserved && preserved < prepare && prepare < sdk);
  assert.ok(ci.includes('qa/we-handshake-20261115/final_gate.py'));
  assert.ok(ci.includes('python3 scripts/verify_we_logger_bundle.py build/outputs/default/*.app'));
  assert.ok(!ci.includes('secrets.LOGGER_'));
  assert.ok(ci.includes('SIGN_P12_PEM_ELCTON'));
  const scope=JSON.parse(read('package.json'));
  assert.notEqual(scope.type,'module','FA SDK must retain its baseline CommonJS-default scope');
  assert.equal(scope.scripts.test,'node --test tests/*.test.mjs');
});

test('generated logger and local/fixture outputs cannot be staged in the public product repository', () => {
  const ignore=read('.gitignore').split(/\r?\n/);
  for(const name of ['**/common/logsink.js','**/log-config.js','.qa-hmlwsim/','tools/sign/node_modules','qa/we-handshake-20261115/logger/test-runs/','__pycache__/']) assert.ok(ignore.includes(name),name);
});

test('actual source app lifecycle activates fresh public config while old source-test config stays disabled', () => {
  const root=new URL('../',import.meta.url);
  const base=path.join(root.pathname,'qa/we-handshake-20261115/logger/test-runs');
  fs.mkdirSync(base,{recursive:true});
  const project=fs.mkdtempSync(path.join(base,'pipeline-public-'));
  fs.mkdirSync(path.join(project,'entry/src/main/js/MainAbility'),{recursive:true});
  fs.copyFileSync(new URL('../entry/src/main/config.json',import.meta.url),path.join(project,'entry/src/main/config.json'));
  const r=spawnSync('python',['scripts/prepare_we_logger.py',project,'--mode','public-build'],{cwd:root.pathname,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);
  const code=read('entry/src/main/js/MainAbility/app.js').replace(/^import[^\n]*\n/gm,'').replace('export default','var app=');
  const cfg=vm.runInNewContext(fs.readFileSync(path.join(project,'entry/src/main/js/MainAbility/common/log-config.js'),'utf8').replace('export default','var c=')+';c;');
  const module=loader()('common/logsink.js');
  const owner={L:module,logConfig:cfg,wearService:{},console:{info(){}}};
  vm.runInNewContext(code+';this.result=app;',owner);
  owner.result.onCreate();
  try { assert.equal(owner.result._elctonLogStatus().seq,1); assert.equal(owner.result._elctonLogStatus().pending,1); }
  finally { owner.result.onDestroy(); }
});
