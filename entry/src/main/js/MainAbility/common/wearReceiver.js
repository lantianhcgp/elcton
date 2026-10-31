/* Callback-based transaction receiver. Phone and watch directions are explicit. */
import protocol from './wearProtocol.js';

function createReceiver(storage, options) {
    options = options || {};
    var limit = options.maxBytes || 8192;
    var active = null;
    var busy = false;
    var generation = 0;
    function answer(type, id) {
        return {protocol: 'elcton.sync', version: 1, sender: 'watch', type: type, transferId: id || ''};
    }
    function error(code, id, cb) {
        var out = answer('ERROR', id); out.code = String(code); cb(out);
    }
    function receive(raw, cb) {
        var msg;
        try {
            if (typeof raw !== 'string' || raw.length > 1024 || /[^\x20-\x7e]/.test(raw)) { throw new Error('INVALID_PACKET'); }
            msg = JSON.parse(raw);
            if (!msg || msg.protocol !== 'elcton.sync' || msg.version !== 1 || msg.sender !== 'phone') { throw new Error('INVALID_PROTOCOL'); }
        } catch (e) { error(e.message, '', cb); return; }
        if (busy) { error('BUSY', msg.transferId, cb); return; }
        if (msg.type === 'HELLO' || msg.type === 'STATUS') {
            storage.load(function (err, current) {
                if (err) { error(err, msg.transferId, cb); return; }
                var ready = answer('READY', msg.transferId);
                ready.maxBytes = limit; ready.transports = ['chunks'];
                ready.datasetId = current && current.meta ? current.meta.datasetId || '' : '';
                ready.sourceRevision = current && current.meta ? current.meta.sourceRevision || 0 : 0;
                ready.digest = current && current.meta ? current.meta.appliedDigest || '' : '';
                ready.localDirty = !!(current && current.meta && current.meta.localDirty);
                ready.hasData = !!current;
                cb(ready);
            });
            return;
        }
        if (!/^[A-Za-z0-9_-]{1,40}$/.test(msg.transferId || '')) { error('INVALID_TRANSFER_ID', '', cb); return; }
        if (msg.type === 'BEGIN') {
            if (typeof msg.length !== 'number' || msg.length < 1 || msg.length > limit || Math.floor(msg.length) !== msg.length ||
                typeof msg.datasetId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(msg.datasetId) ||
                typeof msg.sourceRevision !== 'number' || msg.sourceRevision < 1 || Math.floor(msg.sourceRevision) !== msg.sourceRevision ||
                !/^[0-9a-f]{8}$/.test(msg.digest || '') || msg.chunks < 1 || msg.chunks > 128 || Math.floor(msg.chunks) !== msg.chunks) {
                error('INVALID_BEGIN', msg.transferId, cb); return;
            }
            if (active) {
                if (active.info.transferId === msg.transferId && active.info.digest === msg.digest && active.info.length === msg.length) {
                    var repeated = answer('ACK', msg.transferId); repeated.seq = -1; cb(repeated);
                } else { error('BUSY', msg.transferId, cb); }
                return;
            }
            busy = true;
            var beginGeneration = generation;
            storage.load(function (err, current) {
                if (beginGeneration !== generation) { busy = false; error('CANCELLED', msg.transferId, cb); return; }
                if (err) { busy = false; error(err, msg.transferId, cb); return; }
                var same = current && current.meta && current.meta.datasetId === msg.datasetId;
                if (same && msg.sourceRevision < current.meta.sourceRevision) { busy = false; error('STALE_REVISION', msg.transferId, cb); return; }
                var conflict = current && (!same || current.meta.localDirty || (current.meta.appliedDigest && current.meta.appliedDigest !== msg.baseDigest));
                if (conflict && msg.force !== true) { busy = false; error('CONFLICT', msg.transferId, cb); return; }
                storage.reset(function (resetErr) {
                    busy = false;
                    if (beginGeneration !== generation) { error('CANCELLED', msg.transferId, cb); return; }
                    if (resetErr) { error(resetErr, msg.transferId, cb); return; }
                    active = {info: msg, seq: 0, text: '', last: ''};
                    var ack = answer('ACK', msg.transferId); ack.seq = -1; cb(ack);
                });
            });
            return;
        }
        if (!active || active.info.transferId !== msg.transferId) {
            if (msg.type === 'END') {
                storage.load(function (err, record) {
                    if (err || !record || !record.meta || record.meta.transferId !== msg.transferId) { error(err || 'NO_TRANSFER', msg.transferId, cb); return; }
                    if (record.meta.localDirty) { error('LOCAL_CHANGED', msg.transferId, cb); return; }
                    var applied = answer('APPLIED', msg.transferId); applied.digest = record.meta.appliedDigest;
                    applied.sourceRevision = record.meta.sourceRevision; cb(applied);
                });
            } else { error('NO_TRANSFER', msg.transferId, cb); }
            return;
        }
        if (msg.type === 'CHUNK') {
            if (msg.seq === active.seq - 1 && msg.data === active.last) {
                var duplicate = answer('ACK', msg.transferId); duplicate.seq = msg.seq; cb(duplicate); return;
            }
            if (msg.seq !== active.seq || typeof msg.data !== 'string' || /[^\x20-\x7e]/.test(msg.data) ||
                msg.data.length === 0 || active.text.length + msg.data.length > active.info.length || active.seq >= active.info.chunks) {
                error('INVALID_CHUNK', msg.transferId, cb); return;
            }
            busy = true;
            var chunkGeneration = generation;
            storage.append(msg.seq, msg.data, function (err) {
                busy = false;
                if (chunkGeneration !== generation || !active) { error('CANCELLED', msg.transferId, cb); return; }
                if (err) { active = null; error(err, msg.transferId, cb); return; }
                active.text += msg.data; active.last = msg.data; active.seq++;
                var ack = answer('ACK', msg.transferId); ack.seq = msg.seq; cb(ack);
            });
            return;
        }
        if (msg.type === 'CANCEL') {
            generation++; active = null; storage.reset(function (err) { if (err) { error(err, msg.transferId, cb); } else { cb(answer('CANCELLED', msg.transferId)); } }); return;
        }
        if (msg.type !== 'END') { error('UNSUPPORTED_MESSAGE', msg.transferId, cb); return; }
        var transaction = active;
        if (transaction.seq !== transaction.info.chunks || transaction.text.length !== transaction.info.length || protocol.crc32(transaction.text) !== transaction.info.digest) {
            active = null; error('INCOMPLETE_OR_CORRUPT', msg.transferId, cb); return;
        }
        try { protocol.snapshot(JSON.parse(transaction.text)); } catch (e) { active = null; error(e.message, msg.transferId, cb); return; }
        busy = true;
        storage.commit(transaction.text, {datasetId: transaction.info.datasetId, sourceRevision: transaction.info.sourceRevision,
            appliedDigest: transaction.info.digest, transferId: msg.transferId, localDirty: false}, function (err, record) {
            busy = false; active = null;
            if (err || !record) { error(err || 'SAVE_FAILED', msg.transferId, cb); return; }
            var applied = answer('APPLIED', msg.transferId); applied.digest = transaction.info.digest;
            applied.sourceRevision = transaction.info.sourceRevision; cb(applied);
        });
    }
    return {receive: receive, cancel: function () { generation++; active = null; }, isBusy: function () { return busy || !!active; }};
}
export default createReceiver;
