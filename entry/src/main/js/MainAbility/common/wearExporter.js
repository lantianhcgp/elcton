/* A frozen reverse-transfer snapshot. Phone explicitly asks each chunk, so retries are idempotent. */
import protocol from './wearProtocol.js';
function createExporter(load) {
    var frozen = null;
    var loading = null;
    var generation = 0;
    function reply(type, id) { return {protocol:'elcton.sync',version:1,sender:'watch',type:type,transferId:id || ''}; }
    function failure(code, id) { var out=reply('ERROR',id);out.code=String(code);return out; }
    function meta(id) {
        var out=reply('EXPORT_META',id);out.length=frozen.text.length;out.digest=frozen.digest;
        out.chunks=Math.ceil(frozen.text.length/300);out.sourceRevision=frozen.revision;return out;
    }
    function finish(operation, out) {
        if (loading === operation) { loading = null; }
        var callbacks=operation.callbacks;operation.callbacks=[];
        for (var i=0;i<callbacks.length;i++) { callbacks[i](out); }
    }
    function cancel() {
        generation++;frozen=null;
        if (loading) { finish(loading,failure('CANCELLED',loading.id)); }
    }
    function receive(raw, cb) {
        var msg;
        try {
            if (typeof raw !== 'string' || raw.length > 1024 || /[^\x20-\x7e]/.test(raw)) { throw new Error('INVALID_PACKET'); }
            msg = JSON.parse(raw);
            if (!msg || msg.protocol !== 'elcton.sync' || msg.version !== 1 || msg.sender !== 'phone' || typeof msg.transferId !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(msg.transferId)) { throw new Error('INVALID_PROTOCOL'); }
        } catch (e) { cb(failure('INVALID_PACKET',''));return; }
        if (msg.type === 'EXPORT_REQUEST') {
            if (loading) {
                if (loading.id !== msg.transferId) { cb(failure('BUSY',msg.transferId));return; }
                if (loading.callbacks.length >= 4) { cb(failure('RETRY_LIMIT',msg.transferId));return; }
                loading.callbacks.push(cb);return;
            }
            if (frozen) {
                cb(frozen.id === msg.transferId ? meta(msg.transferId) : failure('BUSY',msg.transferId));return;
            }
            var operation={id:msg.transferId,generation:generation,callbacks:[cb]};loading=operation;
            load(function (err,doc) {
                if (loading !== operation || operation.generation !== generation) { return; }
                if (err || !doc || !doc.settings || doc.settings.__loadError) { finish(operation,failure(err || 'READ_FAILED',operation.id));return; }
                var text;
                try { text=protocol.snapshot(doc); } catch(e) { finish(operation,failure('INVALID_DOCUMENT',operation.id));return; }
                if (text.length>32768) { finish(operation,failure('EXPORT_TOO_LARGE',operation.id));return; }
                frozen={id:operation.id,text:text,digest:protocol.crc32(text),revision:doc.__sourceRevision || doc.rev || 0};
                finish(operation,meta(operation.id));
            });
        } else if (msg.type === 'EXPORT_NEXT') {
            if (!frozen || frozen.id!==msg.transferId) { cb(failure('NO_EXPORT',msg.transferId));return; }
            if (typeof msg.seq!=='number' || msg.seq<0 || Math.floor(msg.seq)!==msg.seq || msg.seq*300>=frozen.text.length) { cb(failure('INVALID_SEQUENCE',msg.transferId));return; }
            var chunk=reply('EXPORT_CHUNK',msg.transferId);chunk.seq=msg.seq;chunk.data=frozen.text.substr(msg.seq*300,300);cb(chunk);
        } else if (msg.type === 'EXPORT_DONE' || msg.type==='CANCEL') {
            if ((loading && loading.id !== msg.transferId) || (frozen && frozen.id !== msg.transferId)) { cb(failure('NO_EXPORT',msg.transferId));return; }
            cancel();cb(reply('EXPORT_CLOSED',msg.transferId));
        } else { cb(failure('UNSUPPORTED_MESSAGE',msg.transferId)); }
    }
    return {receive:receive,cancel:cancel,isActive:function(){return !!frozen || !!loading;}};
}
export default createExporter;
