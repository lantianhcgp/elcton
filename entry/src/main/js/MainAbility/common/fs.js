/* App-scoped, bounded callback IO. An issued write keeps its lock until the real callback. */
import systemFile from '@system.file';
var CHUNK = 4096, MAX_READ = 32768, MAX_QUEUE = 12;
var shared = null;
try {
    var app = $app.$def || $app;
    if (!app._elctonIO) { app._elctonIO = {queue: [], busy: false, journalBusy: false}; }
    shared = app._elctonIO;
} catch (e) {}
function allowed(uri) { return typeof uri === 'string' && uri.indexOf('internal://app/') === 0 && uri.indexOf('..') < 0; }
function enqueue(run, cb) {
    if (!shared) { cb('APP_CONTEXT_UNAVAILABLE'); return; }
    if (shared.queue.length >= MAX_QUEUE) { cb('IO_BUSY'); return; }
    shared.queue.push({run:run,cb:cb}); pump();
}
function pump() {
    if (!shared || shared.busy || !shared.queue.length) { return; }
    var task = shared.queue.shift(), done = false;
    shared.busy = true;
    function finish(err, value) {
        if (done) { return; } done = true; shared.busy = false;
        try { task.cb(err, value); } finally { pump(); }
    }
    try { task.run(finish); } catch (e) { finish('IO_EXCEPTION'); }
}
function readRaw(uri, cb) {
    var ended = false;
    function finish(err, value) { if (ended) { return; } ended = true; cb(err, value); }
    try { systemFile.get({uri:uri,success:function(meta) {
        if (ended) { return; }
        var len = Number(meta && meta.length);
        if (!isFinite(len) || len < 0 || Math.floor(len) !== len || len > MAX_READ) { finish('READ_LIMIT'); return; }
        if (!len) { finish(null, ''); return; }
        var index = 0, text = '', count = Math.ceil(len / CHUNK);
        function step() {
            if (ended) { return; }
            if (index >= count) { finish(null, text); text = null; return; }
            var expected = index, called = false;
            try { systemFile.readText({uri:uri,position:index*CHUNK,length:CHUNK,
                success:function(data) {
                    if (ended || called || expected !== index) { return; } called = true;
                    if (!data || typeof data.text !== 'string' || data.text.indexOf('\ufffd') >= 0) { finish('INVALID_TEXT'); return; }
                    text += data.text; index++; step();
                },fail:function(data,code) { if (!called) { called=true; finish(code || 300); } }});
            } catch (e) { finish('READ_EXCEPTION'); }
        }
        step();
    },fail:function(data,code) { finish(code || 300); }}); }
    catch (e) { finish('READ_EXCEPTION'); }
}
function readFile(uri, cb) {
    if (!allowed(uri)) { cb('INVALID_PATH'); return; }
    enqueue(function(done) { readRaw(uri, done); }, cb);
}
function write(uri, text, append, cb) {
    if (!allowed(uri) || uri.indexOf('/rawfile/') >= 0 || typeof text !== 'string' || text.length > MAX_READ) { cb('INVALID_WRITE'); return; }
    enqueue(function(done) {
        var called = false;
        try { systemFile.writeText({uri:uri,text:text,append:append,
            success:function() {
                if (called) { return; } called=true;
                if (append) { done(null); return; }
                readRaw(uri,function(err,saved) { done(err || (saved !== text ? 'VERIFY_WRITE' : null), true); });
            },fail:function(data,code) { if (!called) { called=true; done(code || 300); } }}); }
        catch (e) { done('WRITE_EXCEPTION'); }
    }, cb);
}
function writeFile(uri, text, cb) { write(uri, text, false, cb); }
function appendFile(uri, text, cb) { write(uri, text, true, cb); }
function backup(uri, text, cb) { writeFile(uri, text, cb || function() {}); }
writeFile.shared = shared;
export default {readFile:readFile,writeFile:writeFile,appendFile:appendFile,backup:backup,rawApi:systemFile,shared:shared};
