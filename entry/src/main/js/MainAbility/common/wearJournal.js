/* Verified two-slot journal. Platform I/O is injected; never trusts an uncommitted data file. */
import protocol from './wearProtocol.js';

function createJournal(io) {
    var prefix = 'internal://app/we-';
    var shared = io.shared || (io.write && io.write.shared) || io;
    function decode(text) {
        try {
            var envelope = JSON.parse(text);
            var record = envelope.record;
            if (!record || envelope.digest !== protocol.crc32(protocol.ascii(record)) ||
                record.version !== 1 || (record.slot !== 'a' && record.slot !== 'b') ||
                typeof record.generation !== 'number' || record.generation < 1 || record.generation > 9007199254740990 || Math.floor(record.generation) !== record.generation ||
                typeof record.length !== 'number' || record.length < 1 || record.length > 32768 || Math.floor(record.length) !== record.length ||
                typeof record.digest !== 'string' || !/^[0-9a-f]{8}$/.test(record.digest) ||
                !record.meta || Object.prototype.toString.call(record.meta) !== '[object Object]') { return null; }
            return record;
        } catch (e) { return null; }
    }
    function candidate(slot, cb) {
        io.read(prefix + 'record-' + slot + '.json', function (err, raw) {
            if (err) { cb(err === 301 ? null : err, null); return; }
            var record = decode(raw);
            if (!record || record.slot !== slot) { cb(null, null, true); return; }
            io.read(prefix + 'data-' + slot + '.json', function (readErr, text) {
                if (readErr) { cb(readErr === 301 ? null : readErr, null, true); return; }
                try {
                    if (text.length !== record.length || protocol.crc32(text) !== record.digest) { cb(null, null, true); return; }
                } catch (e) { cb(null, null, true); return; }
                cb(null, {text: text, meta: record.meta, generation: record.generation, slot: slot});
            });
        });
    }
    function load(cb) {
        candidate('a', function (err, a, badA) {
            if (err) { cb(err); return; }
            candidate('b', function (errB, b, badB) {
                if (errB) { cb(errB); return; }
                if (!a && !b && (badA || badB)) { cb('CORRUPT_JOURNAL');return; }
                cb(null, a && b ? (a.generation > b.generation ? a : b) : (a || b));
            });
        });
    }
    function commit(text, meta, cb, isCurrent, expectedGeneration, onMarker) {
        if (shared.journalBusy) { cb('BUSY'); return; }
        function current() { return !isCurrent || isCurrent(); }
        if (!current()) { cb('CANCELLED'); return; }
        var digest;
        try {
            var doc = JSON.parse(text);
            protocol.snapshot(doc);
            if (text.length > 32768) { throw new Error('SNAPSHOT_TOO_LARGE'); }
            digest = protocol.crc32(text);
        } catch (e) { cb(e.message); return; }
        shared.journalBusy = true;
        function finish(err, result) { shared.journalBusy = false; cb(err, result); }
        load(function (err, previous) {
            if (err) { finish(err); return; }
            if (!current()) { finish('CANCELLED'); return; }
            if (expectedGeneration !== undefined && expectedGeneration !== null &&
                (previous ? previous.generation : 0) !== expectedGeneration) { finish('CONFLICT'); return; }
            var slot = previous && previous.slot === 'a' ? 'b' : 'a';
            var record = {version: 1, slot: slot, generation: previous ? previous.generation + 1 : 1,
                length: text.length, digest: digest, meta: meta};
            var dataUri = prefix + 'data-' + slot + '.json';
            var recordUri = prefix + 'record-' + slot + '.json';
            io.write(dataUri, text, function (writeErr) {
                if (writeErr) { finish(writeErr); return; }
                io.read(dataUri, function (readErr, saved) {
                    if (readErr) { finish(readErr); return; }
                    if (saved !== text) { finish('VERIFY_DATA'); return; }
                    if (!current()) { finish('CANCELLED'); return; }
                    var marker = protocol.ascii({record: record, digest: protocol.crc32(protocol.ascii(record))});
                    // After marker issuance cancellation is too late; reconnect must resolve the result.
                    if (onMarker) { onMarker(); }
                    io.write(recordUri, marker, function (markerErr) {
                        if (markerErr) { finish('COMMIT_UNKNOWN'); return; }
                        candidate(slot, function (verifyErr, result) {
                            if (verifyErr || !result || result.generation !== record.generation) { finish('COMMIT_UNKNOWN'); return; }
                            finish(null, result);
                        });
                    });
                });
            });
        });
    }
    return {load: load, commit: commit};
}
export default createJournal;
