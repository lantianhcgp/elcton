/* Verified two-slot journal. Platform I/O is injected; never trusts an uncommitted data file. */
import protocol from './wearProtocol.js';

function createJournal(io) {
    var prefix = 'internal://app/we-';
    var busy = false;
    function decode(text) {
        try {
            var envelope = JSON.parse(text);
            var record = envelope.record;
            if (!record || envelope.digest !== protocol.crc32(protocol.ascii(record)) ||
                record.version !== 1 || (record.slot !== 'a' && record.slot !== 'b') ||
                record.generation < 1 || Math.floor(record.generation) !== record.generation) { return null; }
            return record;
        } catch (e) { return null; }
    }
    function candidate(slot, cb) {
        io.read(prefix + 'record-' + slot + '.json', function (err, raw) {
            if (err) { cb(err === 301 ? null : err, null); return; }
            var record = decode(raw);
            if (!record || record.slot !== slot) { cb(null, null); return; }
            io.read(prefix + 'data-' + slot + '.json', function (readErr, text) {
                if (readErr) { cb(readErr === 301 ? null : readErr, null); return; }
                try {
                    if (text.length !== record.length || protocol.crc32(text) !== record.digest) { cb(null, null); return; }
                } catch (e) { cb(null, null); return; }
                cb(null, {text: text, meta: record.meta, generation: record.generation, slot: slot});
            });
        });
    }
    function load(cb) {
        candidate('a', function (err, a) {
            if (err) { cb(err); return; }
            candidate('b', function (errB, b) {
                if (errB) { cb(errB); return; }
                cb(null, a && b ? (a.generation > b.generation ? a : b) : (a || b));
            });
        });
    }
    function commit(text, meta, cb, isCurrent) {
        if (busy) { cb('BUSY'); return; }
        function current() { return !isCurrent || isCurrent(); }
        if (!current()) { cb('CANCELLED'); return; }
        var digest;
        try {
            var doc = JSON.parse(text);
            protocol.snapshot(doc);
            if (text.length > 32768) { throw new Error('SNAPSHOT_TOO_LARGE'); }
            digest = protocol.crc32(text);
        } catch (e) { cb(e.message); return; }
        busy = true;
        function finish(err, result) { busy = false; cb(err, result); }
        load(function (err, previous) {
            if (err) { finish(err); return; }
            if (!current()) { finish('CANCELLED'); return; }
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
                    io.write(recordUri, marker, function (markerErr) {
                        if (markerErr) { finish(markerErr); return; }
                        candidate(slot, function (verifyErr, result) {
                            if (verifyErr || !result || result.generation !== record.generation) { finish(verifyErr || 'VERIFY_COMMIT'); return; }
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
