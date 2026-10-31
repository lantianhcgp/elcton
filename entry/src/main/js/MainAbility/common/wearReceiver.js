/* Callback-based transaction receiver. Phone and watch directions are explicit. */
import protocol from './wearProtocol.js';

function createReceiver(storage, options) {
    options = options || {};
    var limit = options.maxBytes || 8192;
    var active = null;
    var operation = null;
    var generation = 0;
    function answer(type, id) {
        return {protocol:'elcton.sync',version:1,sender:'watch',type:type,transferId:id || ''};
    }
    function failure(code, id) { var out=answer('ERROR',id);out.code=String(code);return out; }
    function beginOperation(msg, cb) {
        operation={message:msg,key:protocol.ascii(msg),generation:generation,callbacks:[cb]};return operation;
    }
    function current(task) { return operation === task && task.generation === generation; }
    function finish(task, out) {
        if (operation === task) { operation=null; }
        var callbacks=task.callbacks;task.callbacks=[];
        for (var i=0;i<callbacks.length;i++) { callbacks[i](out); }
    }
    function cancel() {
        generation++;active=null;
        // An issued file write cannot be undone. Keep the IO lock until its callback drains;
        // the next BEGIN resets the staging file only after that lock is released.
    }
    function receive(raw, cb) {
        var msg;
        try {
            if (typeof raw !== 'string' || raw.length>1024 || /[^\x20-\x7e]/.test(raw)) { throw new Error('INVALID_PACKET'); }
            msg=JSON.parse(raw);
            if (!msg || msg.protocol!=='elcton.sync' || msg.version!==1 || msg.sender!=='phone') { throw new Error('INVALID_PROTOCOL'); }
        } catch(e) { cb(failure(e.message,''));return; }
        if (msg.type==='HELLO' || msg.type==='STATUS') {
            var queryGeneration=generation;
            storage.load(function(err,record) {
                if (queryGeneration!==generation) { cb(failure('CANCELLED',msg.transferId));return; }
                if (err) { cb(failure(err,msg.transferId));return; }
                var meta=record && record.meta;var ready=answer('READY',msg.transferId);
                ready.maxBytes=limit;ready.transports=['chunks'];ready.datasetId=meta ? meta.datasetId || '' : '';
                ready.sourceRevision=meta ? meta.sourceRevision || 0 : 0;ready.digest=meta ? meta.appliedDigest || '' : '';
                ready.localDirty=!!(meta && meta.localDirty);ready.hasData=!!record;cb(ready);
            });return;
        }
        if (!/^[A-Za-z0-9_-]{1,40}$/.test(msg.transferId || '')) { cb(failure('INVALID_TRANSFER_ID',''));return; }
        if (msg.type==='CANCEL') {
            var id=operation ? operation.message.transferId : active ? active.info.transferId : '';
            if (id && id!==msg.transferId) { cb(failure('NO_TRANSFER',msg.transferId));return; }
            cancel();cb(answer('CANCELLED',msg.transferId));return;
        }
        if (operation) {
            if (operation.generation===generation && operation.key===protocol.ascii(msg)) {
                if (operation.callbacks.length>=4) { cb(failure('RETRY_LIMIT',msg.transferId));return; }
                operation.callbacks.push(cb);
            } else { cb(failure('BUSY',msg.transferId)); }
            return;
        }
        if (msg.type==='BEGIN') {
            if (typeof msg.length!=='number' || msg.length<1 || msg.length>limit || Math.floor(msg.length)!==msg.length ||
                typeof msg.datasetId!=='string' || !/^[A-Za-z0-9_-]{1,64}$/.test(msg.datasetId) ||
                typeof msg.sourceRevision!=='number' || msg.sourceRevision<1 || !isFinite(msg.sourceRevision) || Math.floor(msg.sourceRevision)!==msg.sourceRevision ||
                !/^[0-9a-f]{8}$/.test(msg.digest || '') || typeof msg.chunks!=='number' || msg.chunks<1 || msg.chunks>128 || Math.floor(msg.chunks)!==msg.chunks) {
                cb(failure('INVALID_BEGIN',msg.transferId));return;
            }
            if (active) {
                if (protocol.ascii(active.info)===protocol.ascii(msg)) { var repeated=answer('ACK',msg.transferId);repeated.seq=-1;cb(repeated); }
                else { cb(failure('BUSY',msg.transferId)); } return;
            }
            var begin=beginOperation(msg,cb);
            storage.load(function(err,record) {
                if (!current(begin)) { finish(begin,failure('CANCELLED',msg.transferId));return; }
                if (err) { finish(begin,failure(err,msg.transferId));return; }
                var same=record && record.meta && record.meta.datasetId===msg.datasetId;
                if (same && msg.sourceRevision<record.meta.sourceRevision) { finish(begin,failure('STALE_REVISION',msg.transferId));return; }
                var conflict=record && (!same || record.meta.localDirty || (record.meta.appliedDigest && record.meta.appliedDigest!==msg.baseDigest));
                if (conflict && msg.force!==true) { finish(begin,failure('CONFLICT',msg.transferId));return; }
                storage.reset(function(resetErr) {
                    if (!current(begin)) { finish(begin,failure('CANCELLED',msg.transferId));return; }
                    if (resetErr) { finish(begin,failure(resetErr,msg.transferId));return; }
                    active={info:msg,seq:0,text:'',last:''};var ack=answer('ACK',msg.transferId);ack.seq=-1;finish(begin,ack);
                });
            });return;
        }
        if (!active || active.info.transferId!==msg.transferId) {
            if (msg.type==='END') {
                var endQueryGeneration=generation;
                storage.load(function(err,record) {
                    if (endQueryGeneration!==generation) { cb(failure('CANCELLED',msg.transferId));return; }
                    if (err || !record || !record.meta || record.meta.transferId!==msg.transferId) { cb(failure(err || 'NO_TRANSFER',msg.transferId));return; }
                    if (record.meta.localDirty) { cb(failure('LOCAL_CHANGED',msg.transferId));return; }
                    var out=answer('APPLIED',msg.transferId);out.digest=record.meta.appliedDigest;out.sourceRevision=record.meta.sourceRevision;cb(out);
                });
            } else { cb(failure('NO_TRANSFER',msg.transferId)); } return;
        }
        var transaction=active;
        if (msg.type==='CHUNK') {
            if (msg.seq===transaction.seq-1 && msg.data===transaction.last) { var duplicate=answer('ACK',msg.transferId);duplicate.seq=msg.seq;cb(duplicate);return; }
            if (msg.seq!==transaction.seq || typeof msg.data!=='string' || /[^\x20-\x7e]/.test(msg.data) || !msg.data.length ||
                transaction.text.length+msg.data.length>transaction.info.length || transaction.seq>=transaction.info.chunks) { cb(failure('INVALID_CHUNK',msg.transferId));return; }
            var chunk=beginOperation(msg,cb);
            storage.append(msg.seq,msg.data,function(err) {
                if (!current(chunk) || active!==transaction) { finish(chunk,failure('CANCELLED',msg.transferId));return; }
                if (err) { active=null;finish(chunk,failure(err,msg.transferId));return; }
                transaction.text+=msg.data;transaction.last=msg.data;transaction.seq++;
                var ack=answer('ACK',msg.transferId);ack.seq=msg.seq;finish(chunk,ack);
            });return;
        }
        if (msg.type!=='END') { cb(failure('UNSUPPORTED_MESSAGE',msg.transferId));return; }
        if (transaction.seq!==transaction.info.chunks || transaction.text.length!==transaction.info.length || protocol.crc32(transaction.text)!==transaction.info.digest) {
            active=null;cb(failure('INCOMPLETE_OR_CORRUPT',msg.transferId));return;
        }
        try { protocol.snapshot(JSON.parse(transaction.text)); } catch(e) { active=null;cb(failure(e.message,msg.transferId));return; }
        var commit=beginOperation(msg,cb);
        storage.commit(transaction.text,{datasetId:transaction.info.datasetId,sourceRevision:transaction.info.sourceRevision,
            appliedDigest:transaction.info.digest,transferId:msg.transferId,localDirty:false},function(err,record) {
            if (!current(commit) || active!==transaction) { finish(commit,failure('CANCELLED',msg.transferId));return; }
            active=null;
            if (err || !record) { finish(commit,failure(err || 'SAVE_FAILED',msg.transferId));return; }
            var applied=answer('APPLIED',msg.transferId);applied.digest=transaction.info.digest;applied.sourceRevision=transaction.info.sourceRevision;finish(commit,applied);
        },function(){return current(commit) && active===transaction;});
    }
    return {receive:receive,cancel:cancel,isBusy:function(){return !!operation || !!active;}};
}
export default createReceiver;
