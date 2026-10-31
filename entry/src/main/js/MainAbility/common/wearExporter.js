/* A frozen reverse-transfer snapshot. Phone explicitly asks each chunk, so retries are idempotent. */
import protocol from './wearProtocol.js';
function createExporter(load) {
    var frozen = null;
    var gen = 0;
    function receive(raw, cb) {
        var msg;
        try {
            if (typeof raw !== 'string' || raw.length > 1024) { throw new Error('INVALID_PACKET'); }
            msg = JSON.parse(raw);
            if (msg.protocol !== 'elcton.sync' || msg.version !== 1 || msg.sender !== 'phone' || !/^[A-Za-z0-9_-]{1,40}$/.test(msg.transferId || '')) { throw new Error('INVALID_PROTOCOL'); }
        } catch (e) { cb({protocol:'elcton.sync',version:1,sender:'watch',type:'ERROR',transferId:'',code:e.message}); return; }
        function reply(type) { return {protocol:'elcton.sync',version:1,sender:'watch',type:type,transferId:msg.transferId}; }
        function error(code) { var r=reply('ERROR');r.code=String(code);cb(r); }
        if (msg.type === 'EXPORT_REQUEST') {
            if (frozen) {
                if (frozen.id !== msg.transferId) { error('BUSY'); return; }
                var repeated=reply('EXPORT_META');repeated.length=frozen.text.length;repeated.digest=protocol.crc32(frozen.text);
                repeated.chunks=Math.ceil(frozen.text.length/300);repeated.sourceRevision=frozen.revision;cb(repeated);return;
            }
            var generation=++gen;
            load(function (err,doc) {
                if (generation!==gen) { error('CANCELLED'); return; }
                if (err || !doc || doc.settings.__loadError) { error(err || 'READ_FAILED'); return; }
                var text;
                try { text=protocol.snapshot(doc); } catch(e) { error(e.message); return; }
                if (text.length>32768) { error('EXPORT_TOO_LARGE'); return; }
                frozen={id:msg.transferId,text:text,revision:doc.__sourceRevision || doc.rev || 0};
                var meta=reply('EXPORT_META');meta.length=text.length;meta.digest=protocol.crc32(text);
                meta.chunks=Math.ceil(text.length/300);meta.sourceRevision=frozen.revision;cb(meta);
            });
        } else if (msg.type === 'EXPORT_NEXT') {
            if (!frozen || frozen.id!==msg.transferId) { error('NO_EXPORT'); return; }
            if (typeof msg.seq!=='number' || msg.seq<0 || Math.floor(msg.seq)!==msg.seq || msg.seq*300>=frozen.text.length) { error('INVALID_SEQUENCE'); return; }
            var chunk=reply('EXPORT_CHUNK');chunk.seq=msg.seq;chunk.data=frozen.text.substr(msg.seq*300,300);cb(chunk);
        } else if (msg.type === 'EXPORT_DONE' || msg.type==='CANCEL') { frozen=null;gen++;cb(reply('EXPORT_CLOSED')); }
        else { error('UNSUPPORTED_MESSAGE'); }
    }
    return {receive:receive,cancel:function(){gen++;frozen=null;},isActive:function(){return !!frozen;}};
}
export default createExporter;
