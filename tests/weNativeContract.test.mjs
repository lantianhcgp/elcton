import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {setImmediate as flush} from 'node:timers/promises';
import {loader, fakeFile} from './loadSource.mjs';

// Host API/callback/timer fixtures execute the real source. NOT Bluetooth, native
// firmware, JerryScript, a watch registration, or proof of HELLO -> READY delivery.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ability = path.join(root, 'entry/src/main/js/MainAbility');
const identity = {phonePackage: 'com.hcbiu.elcton', phoneFingerprint: 'a'.repeat(64)};
const hello = {protocol: 'elcton.sync', version: 1, sender: 'phone', type: 'HELLO', transferId: ''};
const ready = {protocol: 'elcton.sync', version: 1, sender: 'watch', type: 'READY', transferId: ''};
function fixture({version = '5.0.0.401', versioned = true, throws = false, def = true, file} = {}) {
    const logs = [], calls = [], subscriptions = [], sends = [], delivered = [], outcomes = [];
    let query, pkg, cert;
    const engine = {
        setPackageName(p) { calls.push('package'); pkg = p; p.complete(); },
        setFingerprint(p) { calls.push('fingerprint'); cert = p; p.complete(); },
        unsubscribeMsg() { calls.push('unsubscribe'); },
        subscribeMsg(p) { calls.push('subscribe'); subscriptions.push(p); p.success({isRegister: true}); },
        sendMsg(p) { calls.push('send'); sends.push(p); }
    };
    if (versioned) engine.getWearEngineVersion = p => { calls.push('version'); assert.equal(p.sdkVersion, '3'); query = p.complete; };
    const app = {};
    const owner = {_elctonLog(stage, meta) { if (throws) throw new Error('fixture logger failure'); logs.push({stage, meta}); }};
    if (def) app.$def = owner;
    else Object.assign(app, owner);
    const load = loader({app, wearengine: engine, file: file || fakeFile().api,
        device: {getInfo: p => p.success({windowWidth: 412, windowHeight: 484, screenShape: 'rect'})}, router: {replace() {}}});
    (app.$def || app)._elctonWearChannel = load('common/wearService.js');
    const channel = load('common/wearChannel.js')(identity);
    function open() { channel.open(raw => delivered.push(raw), e => outcomes.push(e)); if (query) query(version); }
    return {app, engine, load, channel, logs, calls, subscriptions, sends, delivered, outcomes, open,
        get query() { return query; }, get pkg() { return pkg; }, get cert() { return cert; }};
}
const event = (h, stage) => h.logs.findLast(e => e.stage === stage);
function failSend(h, first, second, message = ready) {
    const results = []; h.channel.send(message, e => results.push(e));
    const p = h.sends.at(-1); assert.ok(p, 'actual source must invoke the native send seam');
    p.fail(first, second); return {p, results};
}

for (const versioned of [true, false]) {
    for (const [label, first, second, a1, a2, t1, t2] of [
        ['numeric second zero', 16, 0, 16, 0, 3, 3],
        ['missing arguments', undefined, undefined, undefined, undefined, 0, 0],
        ['numeric string', '-206', '0', '-206', '0', 4, 4],
        ['object own code', {code: 16, message: 'NEVER_CAPTURE_NATIVE_TEXT'}, {code: 0}, 16, 0, 5, 5],
        ['free text', 'NEVER_CAPTURE_NATIVE_TEXT', 'private detail', undefined, undefined, 4, 4],
        ['null and bool', null, false, undefined, undefined, 1, 2],
        ['fraction and infinite', 1.5, Infinity, undefined, undefined, 3, 3],
        ['out of bound numeric', 1000000000, -1000000000, undefined, undefined, 3, 3]
    ]) {
        test(`${versioned ? 'versioned' : 'unversioned'} native fail always maps to SEND_206: ${label}`, () => {
            const h = fixture({versioned}); h.open();
            try {
                const {p, results} = failSend(h, first, second);
                assert.deepEqual(results, ['SEND_206']);
                const e = event(h, 'SEND_FAIL'); assert.ok(e, 'failed native callback needs a fixed SEND_FAIL logger stage');
                assert.equal(e.meta.code, 206); assert.equal(e.meta.type1, t1); assert.equal(e.meta.type2, t2);
                assert.equal(e.meta.arg1, a1); assert.equal(e.meta.arg2, a2);
                if (typeof first === 'string') assert.equal(e.meta.len1, first.length);
                else assert.equal(e.meta.len1, undefined);
                const n = h.logs.length; p.success(); p.fail(99, 99);
                assert.deepEqual(results, ['SEND_206']); assert.equal(h.logs.length, n, 'duplicate send callbacks must not log or complete');
                assert.equal(event(h, 'READY_OK'), undefined);
                assert.ok(event(h, 'READY_FAIL')); assert.ok(h.channel.summary().includes('REG'));
                assert.equal(h.channel.isNegotiated(), versioned, 'send failure must not unregister the receiver');
                h.subscriptions.at(-1).success({message: JSON.stringify(hello)});
                assert.equal(h.delivered.length, 1);
                assert.ok(!JSON.stringify(h.logs).includes('NEVER_CAPTURE_NATIVE_TEXT'));
            } finally { h.channel.close(); }
        });
    }
    test(`${versioned ? 'versioned' : 'unversioned'} success is the separate 207 callback branch`, () => {
        const h = fixture({versioned}); h.open();
        try {
            const results = []; h.channel.send(ready, e => results.push(e)); const p = h.sends.at(-1);
            p.success(); p.fail(16, 0); p.success();
            assert.deepEqual(results, [null]); assert.equal(event(h, 'SEND_OK')?.meta.code, 207);
            assert.equal(event(h, 'READY_OK')?.meta.code, 207); assert.equal(event(h, 'SEND_FAIL'), undefined);
        } finally { h.channel.close(); }
    });
    test(`${versioned ? 'versioned' : 'unversioned'} registration failure invalidates once, blocks resurrection and pending send callbacks`, () => {
        const h = fixture({versioned}); h.open();
        try {
            const old = h.subscriptions.at(-1), results = [];
            h.channel.send(ready, e => results.push(e)); const send = h.sends.at(-1);
            old.fail(16, 0); old.fail(17, 0); old.success({isRegister: true}); old.success({message: JSON.stringify(hello)});
            send.success(); send.fail(16, 0);
            assert.equal(h.outcomes.length, 2, 'notify the current subscriber exactly once after successful registration');
            assert.ok(h.outcomes[1]); assert.equal(h.channel.isNegotiated(), false);
            assert.equal(h.delivered.length, 0); assert.equal(results.length, 0, 'subscription failure ends the pending send generation');
            assert.equal(h.logs.filter(e => e.stage === 'REG_FAIL').length, 1);
            const e = event(h, 'REG_FAIL'); assert.equal(e.meta.arg1, 16); assert.equal(e.meta.arg2, 0);
            let blocked; h.channel.send(ready, e => blocked = e); assert.equal(blocked, 'CHANNEL_CLOSED_OR_TOO_LARGE');
            h.open(); old.fail(88, 0); old.success({message: JSON.stringify(hello)});
            h.subscriptions.at(-1).success({message: JSON.stringify(hello)}); assert.equal(h.delivered.length, 1);
            h.channel.close(); h.subscriptions.at(-1).success({message: JSON.stringify(hello)});
            assert.equal(h.delivered.length, 1, 'closed channel cannot deliver');
        } finally { h.channel.close(); }
    });
    test(`${versioned ? 'versioned' : 'unversioned'} failure before registration is terminal for that callback generation`, () => {
        const h = fixture({versioned}); h.engine.subscribeMsg = p => { h.subscriptions.push(p); p.fail(16, 0); };
        h.open(); const old = h.subscriptions.at(-1); const n = h.logs.length;
        old.fail(17, 0); old.success({isRegister: true}); old.success({message: JSON.stringify(hello)});
        assert.equal(h.outcomes.length, 1); assert.ok(h.outcomes[0]); assert.equal(h.delivered.length, 0);
        let error; h.channel.send(ready, e => error = e); assert.equal(error, 'CHANNEL_CLOSED_OR_TOO_LARGE');
        assert.equal(h.logs.length, n); assert.equal(h.logs.filter(e => e.stage === 'REG_FAIL').length, 1);
        h.channel.close();
    });
    test(`${versioned ? 'versioned' : 'unversioned'} close and reopen discard old callbacks without losing the new session`, () => {
        const h = fixture({versioned}); h.open(); const results = [];
        h.channel.send(ready, e => results.push(e)); const oldSend = h.sends.at(-1), oldInbox = h.subscriptions.at(-1);
        h.channel.close(); h.open(); const n = h.logs.length;
        oldSend.fail(16, 0); oldSend.success(); oldInbox.fail(16, 0); oldInbox.success({message: JSON.stringify(hello)});
        assert.equal(results.length, 0); assert.equal(h.logs.length, n); assert.equal(h.outcomes.length, 2);
        h.subscriptions.at(-1).success({message: JSON.stringify(hello)}); assert.equal(h.delivered.length, 1);
        h.channel.close();
    });
}

for (const version of ['401', '3.401', '5.0.401', '5.0.0.401']) {
    test(`one through four numeric version segments use the last segment: ${version}`, () => {
        const h = fixture({version}); h.open();
        try {
            assert.deepEqual(h.outcomes, [null]); assert.equal(h.channel.isNegotiated(), true);
            assert.deepEqual(h.calls.slice(0, 5), ['version', 'package', 'fingerprint', 'unsubscribe', 'subscribe']);
            assert.equal(event(h, 'VER_OK')?.meta.service, 401); assert.ok(event(h, 'BUS_NATIVE'));
            const parts = version.split('.'); for (let i = 0; i < parts.length; i++) assert.equal(Number(event(h, 'VER_OK').meta['v' + i]), Number(parts[i]));
        } finally { h.channel.close(); }
    });
}
for (const version of ['3.302', '5.0.303', '3.400']) {
    test(`legacy routing and package threshold remain unchanged: ${version}`, () => {
        const old = globalThis.FeatureAbility, legacy = [], h = fixture({version});
        globalThis.FeatureAbility = {subscribeMsg(p) { legacy.push('subscribe'); h.subscriptions.push(p); p.success({isRegister: true}); },
            sendMsg(p) { legacy.push('send'); h.sends.push(p); }, unsubscribeMsg() { legacy.push('unsubscribe'); }};
        try {
            h.open(); assert.deepEqual(h.outcomes, [null]); assert.ok(event(h, 'BUS_LEGACY'));
            assert.equal(h.calls.includes('subscribe'), false); assert.equal(h.calls.includes('package'), !version.endsWith('302'));
            const {results} = failSend(h, 16, 0); assert.deepEqual(results, ['SEND_206']); assert.deepEqual(legacy, ['subscribe', 'send']);
        } finally { h.channel.close(); if (old === undefined) delete globalThis.FeatureAbility; else globalThis.FeatureAbility = old; }
    });
}
test('short-version support does not relax numeric/nonempty/four-segment/length/minimum rules', () => {
    for (const version of ['garbage.401', '', null, '5..401', '.401', '401.', '5.0.0.0.401', '5.0.0.+401', '5.0.0.4e2', '5.0.0.0x191', '5.0.0. 401', '301', '3.301', '9'.repeat(41)]) {
        const h = fixture({version}); h.open(); assert.ok(h.outcomes[0], String(version));
        assert.equal(h.calls.includes('subscribe'), false); assert.equal(h.channel.isNegotiated(), false); h.channel.close();
    }
});
test('milestone summary survives more than six READY/send events and records a bounded latest failure', () => {
    const h = fixture(); h.open();
    try {
        for (let i = 0; i < 14; i++) { h.channel.send(ready); h.sends.at(-1).success(); }
        failSend(h, 16, 0);
        assert.match(h.channel.summary(), /SDK401.*VER.*PKG.*CERT.*REG.*SEND_206/);
        assert.ok(h.channel.summary().length <= 192);
        for (const stage of ['SDK_CALL', 'VER_OK', 'BUS_NATIVE', 'PKG_CALL', 'PKG_OK', 'CERT_CALL', 'CERT_OK', 'REG_CALL', 'REG_OK', 'READY_CALL', 'SEND_CALL']) assert.ok(event(h, stage), stage);
        h.channel.close(); assert.ok(event(h, 'CLOSE'));
    } finally { h.channel.close(); }
});
test('unversioned compatibility is diagnosed honestly and never negotiated', () => {
    const h = fixture({versioned: false}); h.open();
    try { assert.ok(event(h, 'SDK_UNAVAILABLE')); assert.ok(event(h, 'BUS_UNVERSIONED')); assert.equal(h.channel.isNegotiated(), false); assert.match(h.channel.summary(), /UNVERSIONED.*PKG.*CERT.*REG/); }
    finally { h.channel.close(); }
});
for (const stage of ['package', 'fingerprint']) {
    test(`${stage} failure records both safe callback arguments and suppresses later completion`, () => {
        const h = fixture(); let saved;
        h.engine[stage === 'package' ? 'setPackageName' : 'setFingerprint'] = p => { saved = p; p.fail(16, 0); };
        h.open(); const n = h.logs.length; saved.complete(); saved.fail(17, 0);
        const e = event(h, stage === 'package' ? 'PKG_FAIL' : 'CERT_FAIL'); assert.ok(e);
        assert.equal(e.meta.arg1, 16); assert.equal(e.meta.arg2, 0); assert.equal(h.logs.length, n);
        assert.equal(h.calls.includes('subscribe'), false); assert.equal(h.outcomes.length, 1); h.channel.close();
    });
}
test('diagnostics never invoke native accessors, inherited code, message, toString or toJSON', () => {
    let reads = 0;
    const inherited = Object.create({get code() { reads++; throw Error('inherited'); }});
    const accessor = {get code() { reads++; throw Error('code'); }, get message() { reads++; throw Error('message'); },
        toString() { reads++; throw Error('toString'); }, toJSON() { reads++; throw Error('toJSON'); }};
    const emptyAccessor = {}; Object.defineProperty(emptyAccessor, 'code', {get: undefined, set: undefined});
    const fn = function () {}; Object.defineProperty(fn, 'code', {get() { reads++; throw Error('function code'); }});
    for (const [first, type] of [[inherited, 5], [accessor, 5], [emptyAccessor, 5], [fn, 6], [Symbol('fixture'), 7]]) {
        const h = fixture(); h.open();
        try { assert.doesNotThrow(() => failSend(h, first, accessor)); const e = event(h, 'SEND_FAIL'); assert.ok(e); assert.equal(e.meta.type1, type); assert.equal(e.meta.arg1, undefined); }
        finally { h.channel.close(); }
    }
    assert.equal(reads, 0);
});
test('short numeric-string projection rejects other spellings and caps string lengths', () => {
    for (const value of ['', '-', '+206', '1e3', ' 206', '１２', '1000000000', 'secret'.repeat(180000)]) {
        const h = fixture(); h.open();
        try { failSend(h, value, '210301031'); const e = event(h, 'SEND_FAIL'); assert.ok(e); assert.equal(e.meta.arg1, undefined); assert.equal(e.meta.arg2, '210301031'); assert.equal(e.meta.len1, Math.min(value.length, 999999)); }
        finally { h.channel.close(); }
    }
});
for (const def of [true, false]) {
    test(`guarded logger lookup uses ${def ? '$app.$def' : '$app'} and isolates logger exceptions`, () => {
        const h = fixture({def}); h.open(); assert.ok(event(h, 'SDK_CALL')); h.channel.close();
        const broken = fixture({def, throws: true}); assert.doesNotThrow(() => broken.open());
        assert.deepEqual(broken.outcomes, [null]); assert.doesNotThrow(() => assert.deepEqual(failSend(broken, 16, 0).results, ['SEND_206']));
        assert.doesNotThrow(() => broken.channel.close());
    });
}
test('real app helper receives the native scalar projection without private payload/identity text', () => {
    const rows = [], appContext = {L: {i: (...args) => rows.push(args)}, logConfig: {}, wearService: {}, console: {info() {}}};
    const source = fs.readFileSync(path.join(ability, 'app.js'), 'utf8').replace(/^import[^\n]*\n/gm, '').replace('export default', 'var app =');
    vm.runInNewContext(source + ';this.result=app;', appContext);
    const h = fixture(); h.app.$def._elctonLog = appContext.result._elctonLog; h.open();
    try {
        failSend(h, {code: 16, message: 'PRIVATE_NATIVE_BODY'}, 0);
        const row = rows.findLast(r => r[0] === 'WE/SEND_FAIL'); assert.ok(row, 'actual app-owned logger must receive the stage');
        assert.match(row[1], /code=206/); assert.match(row[1], /arg1=16/); assert.match(row[1], /arg2=0/); assert.match(row[1], /type1=5/);
        assert.ok(!rows.some(r => r.join(' ').includes('PRIVATE_NATIVE_BODY') || r.join(' ').includes(identity.phoneFingerprint) || r.join(' ').includes(identity.phonePackage)));
    } finally { h.channel.close(); }
});

function pageFixture({fail = true, prepareFailure = false} = {}) {
    const nativeSet = globalThis.setTimeout, nativeClear = globalThis.clearTimeout, timers = new Map(); let next = 0;
    globalThis.setTimeout = (fn, ms) => { const id = next++; timers.set(id, {fn, ms}); return id; };
    globalThis.clearTimeout = id => timers.delete(id);
    const file = fakeFile(); if (prepareFailure) file.api.get = p => queueMicrotask(() => p.fail('PRIVATE_STORAGE_TEXT', 300));
    const h = fixture({file: file.api});
    h.engine.sendMsg = p => { h.sends.push(p); if (fail) p.fail(16, 0); else p.success(); };
    const spec = h.load('pages/phone-sync/phone-sync.js'), page = {...spec, ...spec.data}; delete page.data; page.onInit();
    return {h, page, timers, restore() { try { page.onDestroy(); assert.equal(timers.size, 0); } finally { globalThis.setTimeout = nativeSet; globalThis.clearTimeout = nativeClear; } }};
}
test('proactive failed READY retains SDK/REG detail without pretending that an inbound HELLO arrived', async () => {
    const x = pageFixture();
    try {
        x.page.onListen(); x.h.query('5.0.0.401'); await flush();
        assert.match(x.page.detail, /SDK401.*VER.*PKG.*CERT.*REG/); assert.match(x.page.detail, /SEND_206/);
        assert.equal(x.page.listening, true); assert.equal(x.h.channel.isNegotiated(), false, 'separate fixture channel was not opened');
        assert.ok(event(x.h, 'READY_PREPARE')); assert.ok(event(x.h, 'READY_PREPARED')); assert.ok(event(x.h, 'READY_FAIL'));
        assert.equal(event(x.h, 'HELLO_RECV'), undefined, 'synthetic proactive HELLO is not inbound evidence');
        for (const bad of [{...hello, protocol: 'fake'}, {...hello, version: 2}, {...hello, sender: 'watch'}]) x.h.subscriptions.at(-1).success({message: JSON.stringify(bad)});
        await flush(); assert.equal(event(x.h, 'HELLO_RECV'), undefined);
        x.h.subscriptions.at(-1).success({message: JSON.stringify(hello)}); await flush();
        assert.equal(x.h.logs.filter(e => e.stage === 'HELLO_RECV').length, 1);
        assert.match(x.page.detail, /SDK401.*REG.*SEND_206/); assert.equal(x.page.listening, true);
    } finally { x.restore(); }
});
test('READY preparation failure has a fixed safe stage and does not record response error strings', async () => {
    const x = pageFixture({prepareFailure: true});
    try {
        x.page.onListen(); x.h.query('5.0.0.401'); await flush();
        assert.ok(event(x.h, 'READY_PREPARE_FAIL'));
        assert.equal(event(x.h, 'READY_PREPARED'), undefined);
        assert.ok(!JSON.stringify(x.h.logs).includes('PRIVATE_STORAGE_TEXT'));
        assert.ok(!JSON.stringify(x.h.logs).includes('LOCAL_STORAGE'));
        assert.match(x.page.detail, /SDK401.*REG.*SEND_206/);
    } finally { x.restore(); }
});
test('inbound HELLO preparation error cannot overwrite a synchronous failed-reply milestone summary', async () => {
    const x = pageFixture({prepareFailure: true});
    try {
        x.page.onListen(); x.h.query('5.0.0.401'); await flush();
        x.h.subscriptions.at(-1).success({message: JSON.stringify(hello)}); await flush();
        assert.equal(x.page.phase, 'error'); assert.equal(x.page.listening, true);
        assert.match(x.page.detail, /SDK401.*VER.*PKG.*CERT.*REG.*SEND_206/);
        assert.match(x.page.detail, /回执失败/);
        assert.equal(x.h.logs.filter(e => e.stage === 'HELLO_RECV').length, 1);
    } finally { x.restore(); }
});
test('proactive preparation error retains registration summary even when its ERROR reply sends successfully', async () => {
    const x = pageFixture({prepareFailure: true, fail: false});
    try {
        x.page.onListen(); x.h.query('5.0.0.401'); await flush();
        assert.equal(x.page.phase, 'error'); assert.equal(x.page.listening, true);
        assert.match(x.page.detail, /SDK401.*VER.*PKG.*CERT.*REG/);
        assert.ok(event(x.h, 'READY_PREPARE_FAIL')); assert.equal(event(x.h, 'HELLO_RECV'), undefined);
    } finally { x.restore(); }
});
