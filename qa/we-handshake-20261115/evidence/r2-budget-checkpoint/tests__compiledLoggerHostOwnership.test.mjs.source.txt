import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {selectCompiledChannel} from '../qa/we-handshake-20261115/compiled-logger-host.mjs';

const hostUrl = new URL('../qa/we-handshake-20261115/compiled-logger-host.mjs', import.meta.url);
// Invoke the exported host function itself; no rewritten product/source factory.
function actualHelper() { return selectCompiledChannel; }

function fixtures() {
  const identity = Object.freeze({HOST: 'identity'});
  const protocol = Object.freeze({HOST: 'WE_API_PROTOCOL_SEAM'});
  const engine = Object.freeze({HOST: 'WE_API_ENGINE_SEAM'});
  const returned = Object.freeze({HOST: 'ACTUAL_APP_CHANNEL'});
  const calls = [];
  let sourceCalls = 0;
  const forbiddenSourceFactory = () => {
    sourceCalls++;
    throw new Error('SOURCE FACTORY MUST NEVER EXECUTE');
  };
  const actualVm = {
    _elctonWearCompat(...args) { calls.push({owner: this, route: 'compat', args}); return returned; },
    _elctonWearChannel(...args) { calls.push({owner: this, route: 'versioned', args}); return returned; }
  };
  return {identity, protocol, engine, returned, calls, actualVm, forbiddenSourceFactory,
    sourceCalls: () => sourceCalls};
}

test('unversioned selects actual app compat exactly once with original argument references', () => {
  const select = actualHelper();
  const f = fixtures();
  const result = select(f.actualVm, {noVersion: true}, f.identity, f.protocol, f.engine, f.forbiddenSourceFactory);
  assert.equal(result, f.returned);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].owner, f.actualVm);
  assert.equal(f.calls[0].route, 'compat');
  assert.equal(f.calls[0].args.length, 3);
  assert.equal(f.calls[0].args[0], f.identity);
  assert.equal(f.calls[0].args[1], f.protocol);
  assert.equal(f.calls[0].args[2], f.engine);
  assert.equal(f.sourceCalls(), 0);
});

test('versioned keeps the actual app versioned factory and receiver', () => {
  const select = actualHelper();
  const f = fixtures();
  const result = select(f.actualVm, {noVersion: false}, f.identity, f.protocol, f.engine, f.forbiddenSourceFactory);
  assert.equal(result, f.returned);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].owner, f.actualVm);
  assert.equal(f.calls[0].route, 'versioned');
  assert.equal(f.calls[0].args.length, 3);
  assert.equal(f.calls[0].args[0], f.identity);
  assert.equal(f.calls[0].args[1], f.protocol);
  assert.equal(f.calls[0].args[2], f.engine);
  assert.equal(f.sourceCalls(), 0);
});

test('missing actual compat fails explicitly and never falls back to source', () => {
  const select = actualHelper();
  const f = fixtures();
  delete f.actualVm._elctonWearCompat;
  assert.throws(() => select(f.actualVm, {noVersion: true}, f.identity, f.protocol, f.engine, f.forbiddenSourceFactory),
    /actual_app_unversioned_compat_factory_missing/);
  assert.equal(f.calls.length, 0);
  assert.equal(f.sourceCalls(), 0);
});

test('throwing actual compat preserves failure without invoking source', () => {
  const select = actualHelper();
  const f = fixtures();
  const failure = new Error('HOST owner failure');
  f.actualVm._elctonWearCompat = function () { throw failure; };
  assert.throws(() => select(f.actualVm, {noVersion: true}, f.identity, f.protocol, f.engine, f.forbiddenSourceFactory),
    error => error === failure);
  assert.equal(f.sourceCalls(), 0);
});

test('import is CLI-inert and exposes the real helper without app or secret IO', () => {
  const script = `const m = await import(${JSON.stringify(hostUrl.href)}); if (typeof m.selectCompiledChannel !== 'function') throw new Error('missing ownership helper');`;
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], {encoding: 'utf8', timeout: 5000});
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, '');
  assert.equal(run.stderr, '');
});

test('direct CLI help retains HOST usage without requiring input', () => {
  const run = spawnSync(process.execPath, [hostUrl.pathname, '--help'], {encoding: 'utf8', timeout: 5000});
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /HOST ONLY: node compiled-logger-host\.mjs/);
  assert.match(run.stdout, /No --network/);
  assert.equal(run.stderr, '');
});
