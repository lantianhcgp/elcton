#!/usr/bin/env node
// HOST adapters only. Executes the supplied SDK bundle bytes unchanged.
// No source-export rewrite, SDK synthesis, real fetch, device or cloud claim.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import inspector from 'node:inspector';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const require = createRequire(import.meta.url);
class HostQAError extends Error {}

// HOST WE API adapters are arguments only; the channel must be owned by the
// actual compiled app. Missing owners fail closed, never use a source factory.
export function selectCompiledChannel(actualVm, spec, identity, protocol, wearengine) {
  if (spec.noVersion) {
    if (typeof actualVm?._elctonWearCompat !== 'function') {
      throw new HostQAError('actual_app_unversioned_compat_factory_missing');
    }
    return actualVm._elctonWearCompat(identity, protocol, wearengine);
  }
  if (typeof actualVm?._elctonWearChannel !== 'function') {
    throw new HostQAError('actual_app_versioned_channel_factory_missing');
  }
  return actualVm._elctonWearChannel(identity, protocol, wearengine);
}
const report = {
  passed: false,
  host_adapter_only: true,
  native_verified: false,
  real_network_used: false,
  real_cloud_ack_verified: false,
  new_ci_provenance_verified: false,
  original_bytes_executed: false,
  configured_lifecycle_verified: false,
  public_disabled_verified: false,
  host_mock_ack_used: false,
  checks: {}, rows: {}, paths: {},
  clock: {started_at: new Date().toISOString()}
};
function check(name, condition) {
  report.checks[name] = Boolean(condition);
  if (!condition) throw new HostQAError(name);
}
function options(argv) {
  const out = {expect: 'auto'};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--help') return {help: true};
    check('cli_known_options', ['--app', '--js', '--report', '--expect'].includes(key));
    check('cli_values_present', i + 1 < argv.length && !argv[i + 1].startsWith('--'));
    const name = key.slice(2);
    check('cli_no_duplicate_options', out[name] === undefined || (name === 'expect' && out.expect === 'auto'));
    out[name] = argv[++i];
  }
  check('cli_exactly_one_input', Boolean(out.app) !== Boolean(out.js));
  check('cli_report_required', Boolean(out.report));
  check('cli_expect_valid', ['auto', 'public', 'configured'].includes(out.expect));
  return out;
}
async function inputBytes(opt) {
  const input = path.resolve(opt.app || opt.js);
  report.paths[opt.app ? 'app' : 'js'] = input;
  report.paths.report = path.resolve(opt.report);
  check('report_does_not_overwrite_input', report.paths.report !== input);
  check('input_is_regular_file', fs.statSync(input).isFile());
  check('input_size_bounded', fs.statSync(input).size <= 64 * 1024 * 1024);
  const bytes = fs.readFileSync(input);
  if (opt.js) return bytes;
  const JSZip = require('../../tools/sign/node_modules/jszip');
  const outer = await JSZip.loadAsync(bytes);
  const haps = Object.values(outer.files).filter(f => !f.dir && /\.hap$/i.test(f.name));
  check('app_contains_inner_hap', haps.length > 0 && haps.length <= 8);
  const found = [];
  for (const hap of haps) {
    let inner;
    try { inner = await JSZip.loadAsync(await hap.async('nodebuffer')); }
    catch { throw new HostQAError('inner_hap_not_zip_use_extracted_js'); }
    for (const entry of Object.values(inner.files)) {
      if (!entry.dir && /(?:^|\/)(?:assets\/)?js\/[^/]+\/app\.js$/.test(entry.name)) {
        found.push({hap: hap.name, entry: entry.name, bytes: await entry.async('nodebuffer')});
      }
    }
  }
  check('app_has_one_compiled_app_entry', found.length === 1);
  report.paths.inner_hap_entry = found[0].hap;
  report.paths.app_js_entry = found[0].entry;
  return found[0].bytes;
}

// Read the actual onCreate closure using Node's debugger. This is observation,
// not module rewriting: the supplied ViewModel adapter receives original refs.
// Neither L nor wearService is reconstructed, exported or supplied by this QA.
function actualClosureRefs(ctx, fn, capture) {
  const session = new inspector.Session();
  session.connect();
  function post(method, params = {}) {
    let complete = false, failure, result;
    session.post(method, params, (error, value) => { complete = true; failure = error; result = value; });
    if (!complete || failure) throw new HostQAError('host_inspector_unavailable');
    return result;
  }
  let breakpoint, paused = false, listenerFailure;
  const token = '__compiled_logger_HOST_function_probe';
  check('host_inspector_probe_not_preexisting', !Object.hasOwn(globalThis, token));
  globalThis[token] = fn;
  try {
    post('Runtime.enable');
    post('Debugger.enable');
    const objectId = post('Runtime.evaluate', {expression: `globalThis.${token}`}).result.objectId;
    breakpoint = post('Debugger.setBreakpointOnFunctionCall', {objectId}).breakpointId;
    session.on('Debugger.paused', event => {
      paused = true;
      try {
        const scopes = event.params.callFrames[0].scopeChain;
        const visited = new Set();
        function visit(value, depth = 0) {
          if (!value?.objectId || visited.has(value.objectId) || visited.size >= 80) return;
          visited.add(value.objectId);
          const props = post('Runtime.getProperties', {objectId: value.objectId, ownProperties: true}).result;
          const names = new Set(props.filter(p => p.value).map(p => p.name));
          const logger = ['init', 'page', 'status', 'flush', 'stop', 'i'].every(n => names.has(n));
          if (logger || value.type === 'function') {
            // Executed in the object's VM context: capture is a ViewModel HOST
            // observer, never a replacement for a product module.
            post('Runtime.callFunctionOn', {
              objectId: value.objectId,
              functionDeclaration: 'function(){ ViewModel.__hostCaptureOriginalReference(this); }'
            });
          }
          if (depth < 2) for (const prop of props) {
            if (prop.name === 'default' && prop.value) visit(prop.value, depth + 1);
          }
        }
        for (const scope of scopes) {
          if (scope.type !== 'closure' && scope.type !== 'local') continue;
          const props = post('Runtime.getProperties', {objectId: scope.object.objectId, ownProperties: true}).result;
          for (const prop of props) if (prop.value) visit(prop.value);
        }
      } catch (error) { listenerFailure = error; }
      finally { post('Debugger.resume'); }
    });
    ctx.__HOST_app.onCreate.call(ctx.__HOST_app);
    if (listenerFailure) throw listenerFailure;
    check('actual_oncreate_closure_observed', paused);
  } finally {
    if (breakpoint) post('Debugger.removeBreakpoint', {breakpointId: breakpoint});
    delete globalThis[token];
    session.disconnect();
  }
  return capture;
}

function exercise(bytes, opt) {
  check('compiled_js_size_bounded', bytes.length > 0 && bytes.length < 2 * 1024 * 1024);
  report.app_js_sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  const source = bytes.toString('utf8');
  check('compiled_utf8_bytes_roundtrip', Buffer.from(source, 'utf8').equals(bytes));
  check('sdk_webpack_iife_shape', /^\s*\(function\s*\(/.test(source) && /__webpack_modules__/.test(source) && /__webpack_require__/.test(source));
  check('source_export_rewrite_not_used', !/^\s*(?:import\s|export\s)/m.test(source));
  const timers = new Map(), scheduled = [], cleared = [], fetched = [], definitions = [], captured = [];
  const nativeNames = [];
  let nextId = 0, clock = 1700000000000, consoleCalls = 0, createdConsole = false, destroyedConsole = false;
  report.clock.virtual_started_ms = clock;
  const originals = {};
  for (const level of ['debug', 'log', 'info', 'warn', 'error']) originals[level] = function (...args) {
    consoleCalls++;
    if (level === 'info' && args[0] === 'Application onCreate') createdConsole = true;
    if (level === 'info' && args[0] === 'Application onDestroy') destroyedConsole = true;
  };
  const hostConsole = {...originals};
  function setHostTimer(fn, ms, ...args) {
    check('host_timer_callback_is_function', typeof fn === 'function');
    check('host_timer_delay_valid', Number.isFinite(Number(ms)) && Number(ms) >= 0);
    const id = nextId++;
    const timer = {id, fn, args, delay: Number(ms), due: clock + Number(ms)};
    timers.set(id, timer); scheduled.push(timer);
    return id; // 0 is valid and deliberately exercises falsy-id bugs.
  }
  function clearHostTimer(id) { cleared.push(id); timers.delete(id); }
  function fireNext() {
    const timer = [...timers.values()].sort((a, b) => a.due - b.due || a.id - b.id)[0];
    check('host_expected_timer_exists', Boolean(timer));
    timers.delete(timer.id); clock = timer.due;
    timer.fn(...timer.args);
  }
  class HostDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock])); }
    static now() { return clock; }
  }
  function HostViewModel(definition) {
    check('host_viewmodel_receives_real_definition', definition && typeof definition === 'object');
    definitions.push(definition);
    Object.assign(this, definition);
    this.data = definition.data || definition;
  }
  HostViewModel.__hostCaptureOriginalReference = ref => { if (!captured.includes(ref)) captured.push(ref); };
  const hostFetch = {fetch(options) {
    // This callback-only ACK is HOST fiction. No Node fetch/http/socket is called.
    check('host_fetch_post_contract', options && options.method === 'POST' && options.responseType === 'text');
    check('compiled_endpoint_and_key_present', typeof options.url === 'string' && options.url.startsWith('https://') && Boolean(options.header?.['X-Log-Key']));
    check('host_fetch_json_contract', options.header['Content-Type'] === 'application/json' && typeof options.data === 'string');
    const body = JSON.parse(options.data);
    check('host_fetch_rows_contract', Array.isArray(body.logs) && body.logs.length > 0);
    fetched.push(body.logs); // memory only, never serialized in report.
    check('host_fetch_success_callback', typeof options.success === 'function');
    report.host_mock_ack_used = true;
    options.success({code: 200, data: JSON.stringify({ok: true, HOST_MOCK_ACK_NOT_REAL_NETWORK: true})});
  }};
  const device = {getInfo(options) {
    check('host_device_callback_contract', typeof options?.success === 'function');
    options.success({brand: 'HOST', manufacturer: 'HOST', model: 'HOST_ADAPTER_NOT_DEVICE', windowWidth: 412, windowHeight: 484});
  }};
  const ctx = vm.createContext({
    console: hostConsole, ViewModel: HostViewModel,
    requireNative(name) {
      nativeNames.push(name);
      if (name === 'system.configuration') return {};
      if (name === 'system.device') return device;
      if (name === 'system.fetch') return hostFetch;
      throw new HostQAError('unmodelled_native_module_requested');
    },
    setTimeout: setHostTimer, clearTimeout: clearHostTimer,
    setInterval() { throw new HostQAError('unexpected_interval'); },
    clearInterval: clearHostTimer, Date: HostDate
  }, {name: 'HOST_compiled_logger_NOT_DEVICE', codeGeneration: {strings: false, wasm: false}});
  const result = new vm.Script(source, {filename: 'supplied-sdk-app.js'}).runInContext(ctx, {timeout: 3000});
  report.original_bytes_executed = true;
  check('one_real_app_viewmodel', definitions.length === 1);
  const app = definitions[0];
  check('bundle_result_is_app_viewmodel', result && result.data === (app.data || app));
  check('real_application_lifecycle_present', typeof app.onCreate === 'function' && typeof app.onDestroy === 'function');
  check('real_business_wear_factory_present', typeof app._elctonWearChannel === 'function');
  check('real_logger_bridges_present', typeof app._elctonLog === 'function' && typeof app._elctonLogStatus === 'function');
  const status = () => app._elctonLogStatus.call(app);
  const initial = status();
  check('fresh_bundle_counters_zero', initial && initial.seq === 0 && initial.pending === 0 && initial.sent === 0 && initial.failed === 0 && initial.dropped === 0 && !initial.busy);
  check('fresh_bundle_no_timers', timers.size === 0);
  ctx.__HOST_app = app;
  let started = false;
  try {
    started = true;
    actualClosureRefs(ctx, app.onCreate, captured);
    const candidates = captured.filter(ref => ref && ['init', 'page', 'status', 'flush', 'stop', 'i'].every(name => typeof ref[name] === 'function'));
    check('one_actual_bundled_logger_reference', candidates.length === 1);
    const L = candidates[0];
    check('business_reference_same_bundled_instance', result._elctonWearChannel === app._elctonWearChannel && result.data._elctonWearChannel === app._elctonWearChannel);
    const sameStatus = () => JSON.stringify(L.status()) === JSON.stringify(status());
    check('logger_bridge_same_runtime_state', sameStatus());
    const afterCreate = status();
    const configured = afterCreate.seq > 0;
    report.configuration_enabled = configured;
    check('expected_configuration_matches', opt.expect === 'auto' || configured === (opt.expect === 'configured'));
    check('original_application_console_ran', createdConsole);
    report.rows.after_oncreate_seq = afterCreate.seq;
    report.rows.after_oncreate_pending = afterCreate.pending;
    if (configured) {
      check('oncreate_page_and_console_queued', afterCreate.seq >= 2 && afterCreate.pending >= 2 && afterCreate.sent === 0 && !afterCreate.busy);
      check('first_timer_zero_is_live_5s', scheduled[0]?.id === 0 && timers.has(0) && scheduled[0].delay === 5000);
      check('all_console_methods_wrapped', Object.keys(originals).every(name => hostConsole[name] !== originals[name]));
    } else {
      check('public_logger_disabled_after_oncreate', afterCreate.seq === 0 && afterCreate.pending === 0 && timers.size === 0);
      check('public_console_not_wrapped', Object.keys(originals).every(name => hostConsole[name] === originals[name]));
    }
    const beforePage = status();
    L.page('HOST_QA_PAGE');
    check('actual_bundled_page_call_updates_same_state', sameStatus() && status().seq === beforePage.seq + (configured ? 1 : 0));
    const beforeStage = status();
    check('real_stage_bridge_accepts_safe_fields', app._elctonLog.call(app, 'SEND_FAIL', {code: 206, arg1: 210301031, arg2: 0, type1: 3, type2: 3}) === true);
    check('real_stage_bridge_updates_same_logger', sameStatus() && status().seq === beforeStage.seq + (configured ? 1 : 0));
    const beforeInvalid = status();
    check('invalid_stage_rejected', app._elctonLog.call(app, 'INVALID/stage', {}) === false && JSON.stringify(status()) === JSON.stringify(beforeInvalid));
    L.flush();
    if (configured) {
      check('flush_clears_valid_zero_timer', cleared.includes(0) && !timers.has(0));
      check('flush_schedules_50ms_timer', [...timers.values()].some(t => t.delay === 50));
      for (let i = 0; i < 20 && status().pending > 0; i++) fireNext();
      check('host_ack_drains_rows', status().pending === 0 && status().sent >= 4 && !status().busy && status().failed === 0 && status().dropped === 0);
      const logs = fetched.flat();
      check('original_application_page_row_in_actual_request', logs.some(row => row.tag === 'page' && row.msg === 'MainAbility'));
      check('original_application_console_row_in_actual_request', logs.some(row => row.tag === 'console' && row.msg === 'Application onCreate'));
      check('actual_page_row_in_request', logs.some(row => row.tag === 'page' && row.msg === 'HOST_QA_PAGE'));
      check('safe_send_fail_row_in_actual_request', logs.some(row => row.tag === 'WE/SEND_FAIL' && row.level === 'info' && row.msg === 'code=206 arg1=210301031 arg2=0 type1=3 type2=3' && row.page === 'HOST_QA_PAGE'));
      check('actual_request_seq_monotonic', logs.every((row, i) => Number.isInteger(row.seq) && row.seq === i + 1));
      check('host_deadline_cleared_after_ack', ![...timers.values()].some(t => t.delay === 8000));
      report.rows.host_fetch_requests = fetched.length;
      report.rows.host_acked_rows = logs.length;
      report.rows.before_destroy_seq = status().seq;
      report.rows.before_destroy_sent = status().sent;
    } else {
      check('public_explicit_calls_stay_disabled', status().seq === 0 && status().pending === 0 && fetched.length === 0 && timers.size === 0);
      report.rows.host_fetch_requests = 0;
      report.rows.host_acked_rows = 0;
    }
    const beforeDestroy = status();
    app.onDestroy.call(app); started = false;
    const stopped = status();
    check('original_application_destroy_console_ran', destroyedConsole);
    check('destroy_clears_all_timers', timers.size === 0);
    check('destroy_stops_pending_busy_counters', stopped.pending === 0 && !stopped.busy && stopped.failed === beforeDestroy.failed && stopped.dropped === beforeDestroy.dropped);
    check('destroy_preserves_sent_and_counts_its_console', stopped.sent === beforeDestroy.sent && stopped.seq === beforeDestroy.seq + (configured ? 1 : 0));
    check('destroy_restores_all_original_console_methods', Object.keys(originals).every(name => hostConsole[name] === originals[name]));
    const stoppedJSON = JSON.stringify(stopped), requests = fetched.length;
    hostConsole.info('HOST_AFTER_STOP');
    L.page('HOST_AFTER_STOP');
    app._elctonLog.call(app, 'SEND_FAIL', {code: 206});
    L.flush();
    // stop clears endpoint: flush may schedule one inert timer, never a fetch.
    for (let i = 0; i < 4 && timers.size; i++) fireNext();
    check('post_destroy_no_new_rows_or_fetch', JSON.stringify(status()) === stoppedJSON && fetched.length === requests && timers.size === 0);
    L.stop();
    check('repeat_stop_is_clean', timers.size === 0 && Object.keys(originals).every(name => hostConsole[name] === originals[name]));
    report.configured_lifecycle_verified = configured;
    report.public_disabled_verified = !configured;
    report.rows.after_destroy_pending = stopped.pending;
    report.rows.after_destroy_seq = stopped.seq;
    report.rows.after_destroy_sent = stopped.sent;
    report.rows.scheduled_host_timers = scheduled.length;
    report.rows.cleared_host_timer_calls = cleared.length;
    report.rows.final_live_timers = timers.size;
    report.rows.original_console_calls = consoleCalls;
    report.checks.only_explicit_native_adapters = nativeNames.every(name => ['system.configuration', 'system.device', 'system.fetch'].includes(name));
    report.passed = true;
  } finally {
    if (started) {
      try { app.onDestroy.call(app); } catch { /* do not leak compiled exception text */ }
      report.checks.failure_cleanup_timers_empty = timers.size === 0;
      report.checks.failure_cleanup_console_restored = Object.keys(originals).every(name => hostConsole[name] === originals[name]);
    }
    delete ctx.__HOST_app;
    report.clock.virtual_finished_ms = clock;
  }
}

export async function main(argv = process.argv.slice(2)) {
let opt;
try {
  opt = options(argv);
  if (opt.help) {
    console.log('HOST ONLY: node compiled-logger-host.mjs (--app SDK.app | --js extracted-sdk-app.js) --report HOST.json [--expect auto|public|configured]');
    console.log('No --network. ACK is HOST MOCK, not cloud/device evidence. Signed non-ZIP HAP: use --js after independently extracting actual bytes.');
  } else {
    const bytes = await inputBytes(opt);
    exercise(bytes, opt);
  }
} catch (error) {
  const code = error instanceof HostQAError ? error.message : 'host_execution_error_details_withheld';
  report.checks[code] = false;
  process.stderr.write(`HOST_QA_FAIL: ${code}; NOT native/cloud verification\n`);
  process.exitCode = 1;
} finally {
  if (!opt?.help) {
    report.clock.finished_at = new Date().toISOString();
    if (opt?.report && report.paths.report && report.checks.report_does_not_overwrite_input) {
      try {
        fs.mkdirSync(path.dirname(report.paths.report), {recursive: true});
        fs.writeFileSync(report.paths.report, JSON.stringify(report, null, 2) + '\n');
      } catch {
        report.passed = false;
        report.checks.report_write_succeeded = false;
        process.exitCode = 1;
      }
    }
    console.log(JSON.stringify(report));
  }
}

}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await main();
}
