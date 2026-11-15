import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
const script = new URL('../qa/we-handshake-20261115/compiled-we-stages.mjs', import.meta.url);
test('stage HOST runner exists and is import-inert (NOT an actualAPP acceptance)', () => {
  assert.equal(fs.existsSync(script), true, 'missing independent compiled stage runner');
  const r = spawnSync(process.execPath, ['--input-type=module','-e', `await import(${JSON.stringify(script.href)})`], {encoding:'utf8',timeout:5000});
  assert.equal(r.status,0,r.stderr); assert.equal(r.stdout,''); assert.equal(r.stderr,'');
});

test('SYNTHETIC clock adapter: timer zero and self-cleared intervals', async () => {
  const {makeHostClock}=await import(script.href); const c=makeHostClock(); let fired=0;
  const zero=c.set(()=>{fired++;},5000); assert.equal(zero,0); assert.equal(c.timers.has(0),true);
  c.clear(0);assert.equal(c.timers.size,0);
  const repeating=c.set(()=>{fired++;c.clear(repeating);},1,true);c.fire(repeating);
  assert.equal(fired,1);assert.equal(c.timers.size,0);assert.equal(c.cleared.includes(repeating),true);
});

test('CLI rejects network options without executing supplied bytes', () => {
  const r=spawnSync(process.execPath,[script.pathname,'--network'],{encoding:'utf8',timeout:5000});
  assert.equal(r.status,1);const s=JSON.parse(r.stdout);assert.equal(s.passed,false);assert.equal(s.native,false);assert.equal(s.real_https,false);
  assert.equal(s.failure,'cli_exact_app_report_only');assert.equal(r.stderr,'');
});

test('CLI help excludes native and HTTPS acceptance',()=>{
  const r=spawnSync(process.execPath,[script.pathname,'--help'],{encoding:'utf8',timeout:5000});
  assert.equal(r.status,0);assert.match(r.stdout,/HOST ONLY/);assert.match(r.stdout,/no HTTPS\/native\/Bluetooth/);
});
