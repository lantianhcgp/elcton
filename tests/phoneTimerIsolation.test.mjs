import test from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate as flush} from 'node:timers/promises';
import {loader, fakeFile} from './loadSource.mjs';
import protocol from '../entry/src/main/js/MainAbility/common/wearProtocol.js';

// Load the current real page and its dependencies. Only platform timers/APIs are injected.
// Retained callbacks deliberately model delivery after clearTimeout, not native UAF.
function harness(ids = []) {
    const pending = new Map(), retained = [], clears = [];
    const nativeSet = globalThis.setTimeout, nativeClear = globalThis.clearTimeout;
    let next = 0, active = null, unsubscribes = 0, incoming;
    globalThis.setTimeout = (callback, ms) => {
        const id = next < ids.length ? ids[next] : next;
        next++;
        const entry = {id, callback, ms};
        pending.set(id, entry); retained.push(entry);
        return id;
    };
    globalThis.clearTimeout = id => {
        clears.push({id, active: active !== null && active.id === id});
        pending.delete(id);
    };
    const doc = {schema: 'elcton.schedule', version: 1, rev: 1,
        settings: {semesterStart: '2026-09-01'}, courses: []};
    const file = fakeFile({'internal://app/schedule.json': JSON.stringify(doc)});
    const engine = {setPackageName: p => p.complete(), setFingerprint: p => p.complete(),
        subscribeMsg(p) { incoming = p.success; p.success({isRegister: true}); },
        unsubscribeMsg() { unsubscribes++; }, sendMsg: p => p.success()};
    const spec = loader({file: file.api, wearengine: engine,
        device: {getInfo: p => p.success({windowWidth: 412, windowHeight: 484, screenShape: 'rect'})},
        router: {replace() {}}})('pages/phone-sync/phone-sync.js');
    const page = {...spec, ...spec.data}; delete page.data; page.onInit();
    function deliver(entry) {
        active = entry;
        try { entry.callback(); }
        finally {
            active = null;
            if (pending.get(entry.id) === entry) pending.delete(entry.id);
        }
    }
    function state() {
        return [page._gen, page._timer, page._channel, page._receiver, page._exporter,
            page.listening, page.phase, page.status, page.detail, page.buttonLabel, unsubscribes];
    }
    function restore() {
        try { page.onDestroy(); }
        finally { globalThis.setTimeout = nativeSet; globalThis.clearTimeout = nativeClear; }
    }
    function receive(message) { incoming({isRegister: false, message: protocol.ascii(message)}); }
    return {page, pending, retained, clears, deliver, state, receive, doc, restore};
}

// Top-level node:test cases run serially; always restore the process timer hooks.
test('watchDog rearms and clears a valid numeric timer 0', async () => {
    const h = harness();
    try {
        h.page.onListen(); await flush();
        assert.equal(h.page._timer, 0);
        const gen = h.page._gen;
        h.page.watchDog();
        assert.equal(h.page._gen, gen);
        assert.equal(h.page._timer, 1);
        assert.equal(h.pending.has(0), false, 'timer 0 must be cancelled on rearm');
        assert.deepEqual(h.clears.map(x => x.id), [0]);
        assert.equal(h.pending.get(1).ms, 30000, 'existing timeout duration stays unchanged');
    } finally { h.restore(); }
});

test('stop cancels numeric timer 0 and repeated stop never clears null', async () => {
    const h = harness();
    try {
        h.page.onListen(); await flush();
        assert.equal(h.page._timer, 0);
        h.page.stop(); h.page.stop();
        assert.equal(h.page._timer, null);
        assert.equal(h.page.listening, false);
        assert.equal(h.pending.size, 0);
        assert.deepEqual(h.clears.map(x => x.id), [0]);
    } finally { h.restore(); }
});

for (const method of ['onListen', 'onHide', 'onDestroy']) {
    test(`${method} cancels a listening session with numeric timer 0`, async () => {
        const h = harness();
        try {
            h.page.onListen(); await flush();
            assert.equal(h.page._timer, 0);
            h.page[method]();
            assert.equal(h.page.listening, false);
            assert.equal(h.page._timer, null);
            assert.equal(h.pending.size, 0, 'no numeric-zero timeout may survive teardown');
            assert.deepEqual(h.clears.map(x => x.id), [0]);
        } finally { h.restore(); }
    });
}

for (const id of [0, 1]) {
    test(`live timeout ${id} detaches its own slot before stop without clearing itself`, async () => {
        const h = harness([id]);
        try {
            h.page.onListen(); await flush();
            const stop = h.page.stop;
            let slotAtStop = 'NOT_CALLED';
            h.page.stop = function () { slotAtStop = this._timer; return stop.call(this); };
            h.deliver(h.retained[0]);
            assert.equal(slotAtStop, null, 'callback must detach before shared cancellation');
            assert.equal(h.clears.some(x => x.active), false, 'never clear the executing native handle');
            assert.equal(h.page._timer, null);
            assert.equal(h.page.listening, false);
            assert.equal(h.page.phase, 'error');
            assert.equal(h.page.status, '等待超时');
            assert.equal(h.page.detail, '旧课表已保留，可重试');
        } finally { h.restore(); }
    });
}

test('retained callback from a rearmed watchdog cannot close the current same-generation session', async () => {
    const h = harness();
    try {
        h.page.onListen(); await flush();
        const old = h.retained[0];
        h.page.watchDog();
        const before = h.state();
        h.deliver(old);
        assert.deepEqual(h.state(), before, 'stale handle must not change the new slot or session');
        assert.equal(h.pending.has(1), true);
    } finally { h.restore(); }
});

test('retained callback from cancelled generation cannot close a reopened session with reused timer 0', async () => {
    const h = harness([0, 0]);
    try {
        h.page.onListen(); await flush();
        const old = h.retained[0], gen = h.page._gen;
        h.page.onListen();
        h.page.onListen(); await flush();
        assert.ok(h.page._gen > gen);
        assert.equal(h.page._timer, 0, 'platform may recycle the same numeric handle');
        const before = h.state();
        h.deliver(old);
        assert.deepEqual(h.state(), before, 'generation must isolate reused handles');
        assert.equal(h.pending.get(0), h.retained[1]);
    } finally { h.restore(); }
});

test('retained callback after destroy is inert and cannot clear any other timer', async () => {
    const h = harness();
    try {
        h.page.onListen(); await flush();
        const old = h.retained[0];
        h.page.onDestroy();
        const before = h.state(), clearCount = h.clears.length;
        h.deliver(old);
        assert.deepEqual(h.state(), before);
        assert.equal(h.clears.length, clearCount);
    } finally { h.restore(); }
});

test('APPLIED cancels the valid numeric-zero watchdog without timing out the saved session', async () => {
    const h = harness(Array(12).fill(0));
    try {
        h.page.onListen(); await flush();
        const text = protocol.snapshot(h.doc);
        const messages = protocol.plan(text, {transferId: 'timer-applied', datasetId: 'timer-qa',
            sourceRevision: 1, baseDigest: '', force: true});
        for (const message of messages) { h.receive(message); await flush(); }
        assert.equal(h.page.phase, 'applied');
        assert.equal(h.page._timer, null, 'APPLIED must cancel handle 0 too');
        assert.equal(h.pending.size, 0);
        const before = h.state();
        h.deliver(h.retained.at(-1));
        assert.deepEqual(h.state(), before);
    } finally { h.restore(); }
});
