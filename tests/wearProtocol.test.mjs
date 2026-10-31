import test from 'node:test';
import assert from 'node:assert/strict';
let protocol = {};
try { protocol = (await import('../entry/src/main/js/MainAbility/common/wearProtocol.js')).default; }
catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }

test('ASCII JSON preserves Chinese and surrogate pairs with a reproducible checksum', () => {
    assert.equal(typeof protocol.ascii, 'function', 'ASCII protocol encoder is missing');
    const value = {name: '语文🙂', slash: '\\', line: '\n'};
    const wire = protocol.ascii(value);
    assert.match(wire, /^[\x20-\x7e]+$/);
    assert.deepEqual(JSON.parse(wire), value);
    assert.equal(protocol.crc32('123456789'), 'cbf43926');
});

test('packet plan stays below 1024 bytes and reconstructs the identical snapshot', () => {
    assert.equal(typeof protocol.plan, 'function', 'packet planner is missing');
    const text = protocol.ascii({courses: [{name: '语文'.repeat(180)}]});
    const messages = protocol.plan(text, {transferId: 't-001', datasetId: 'school', sourceRevision: 3, baseDigest: '', force: false});
    assert.equal(messages[0].type, 'BEGIN');
    assert.equal(messages.at(-1).type, 'END');
    let reconstructed = '';
    for (const message of messages) {
        assert.ok(Buffer.byteLength(protocol.ascii(message), 'utf8') <= 1024);
        if (message.type === 'CHUNK') reconstructed += message.data;
    }
    assert.equal(reconstructed, text);
    assert.equal(messages[0].digest, protocol.crc32(text));
    assert.equal(messages[0].length, text.length);
});

test('shared snapshots are deterministic and exclude device preferences and local counters', () => {
    assert.equal(typeof protocol.snapshot, 'function', 'shared snapshot validator is missing');
    const course = {id: 'c1', name: '语文', teacher: '', location: '', dayOfWeek: 6, startPeriod: 1, endPeriod: 1, startTime: '08:00', endTime: '08:45', weekType: 'all', weeks: [], colorIndex: 0};
    const doc = {schema: 'elcton.schedule', version: 1, rev: 99, updatedAt: 999, settings: {semesterStart: '2026-09-01', vibrationEnabled: false}, courses: [course]};
    const wire = protocol.snapshot(doc);
    assert.deepEqual(Object.keys(JSON.parse(wire)), ['schema', 'version', 'settings', 'courses']);
    assert.deepEqual(JSON.parse(wire).settings, {semesterStart: '2026-09-01'});
    assert.equal(protocol.snapshot({...doc, rev: 100, updatedAt: 0}), wire);
    assert.equal(JSON.parse(protocol.snapshot({...doc, courses: []})).courses.length, 0);
    assert.throws(() => protocol.snapshot({...doc, version: 2}), /UNSUPPORTED_SCHEMA/);
    assert.throws(() => protocol.snapshot({...doc, courses: [course, course]}), /DUPLICATE_ID/);
    assert.throws(() => protocol.snapshot({...doc, courses: [{...course, endTime: '07:00'}]}), /INVALID_TIME/);
});
