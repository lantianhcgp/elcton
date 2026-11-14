/* Bounded native diagnostics only: never stringify payloads/errors/identities. */
var stages = '|SDK_CALL|SDK_UNAVAILABLE|VER_OK|VER_FAIL|BUS_NATIVE|BUS_LEGACY|BUS_UNVERSIONED|PKG_CALL|PKG_OK|PKG_FAIL|CERT_CALL|CERT_OK|CERT_FAIL|REG_CALL|REG_OK|REG_FAIL|HELLO_RECV|READY_PREPARE|READY_PREPARED|READY_PREPARE_FAIL|READY_CALL|READY_OK|READY_FAIL|SEND_CALL|SEND_OK|SEND_FAIL|CLOSE|';
function scalar(value) {
    if (typeof value === 'number') {
        return isFinite(value) && Math.floor(value) === value && value >= -999999999 && value <= 999999999 ? value : undefined;
    }
    if (typeof value !== 'string' || !value.length || value.length > 9) { return undefined; }
    var start = value.charCodeAt(0) === 45 ? 1 : 0;
    if (start === value.length) { return undefined; }
    for (var i = start; i < value.length; i++) { var c = value.charCodeAt(i); if (c < 48 || c > 57) { return undefined; } }
    return value;
}
function type(value) {
    if (value === undefined) { return 0; } if (value === null) { return 1; }
    var t = typeof value;
    return t === 'boolean' ? 2 : t === 'number' ? 3 : t === 'string' ? 4 : t === 'object' ? 5 : t === 'function' ? 6 : 7;
}
function ownCode(value) {
    if (!value || typeof value !== 'object') { return scalar(value); }
    try {
        var d = Object.getOwnPropertyDescriptor(value, 'code');
        if (d && Object.prototype.hasOwnProperty.call(d, 'value') && typeof d.value === 'number') { return scalar(d.value); }
    } catch (ignored) {}
    return undefined;
}
function log(stage, meta) {
    try {
        if (typeof stage !== 'string' || !stage.length || stages.indexOf('|' + stage + '|') < 0) { return; }
        var safe = {}, names = ['code', 'bytes', 'arg1', 'arg2', 'type1', 'type2', 'len1', 'len2', 'service', 'v0', 'v1', 'v2', 'v3'];
        for (var i = 0; meta && typeof meta === 'object' && i < names.length; i++) {
            var d = Object.getOwnPropertyDescriptor(meta, names[i]);
            if (!d || !Object.prototype.hasOwnProperty.call(d, 'value')) { continue; }
            var v = scalar(d.value); if (v !== undefined) { safe[names[i]] = v; }
        }
        var app = $app.$def || $app;
        if (typeof app._elctonLog === 'function') { app._elctonLog(stage, safe); }
    } catch (ignored) {}
}
function fail(stage, first, second, code) {
    try {
        var meta = {code: code, type1: type(first), type2: type(second)};
        var a = ownCode(first), b = ownCode(second);
        if (a !== undefined) { meta.arg1 = a; } if (b !== undefined) { meta.arg2 = b; }
        if (typeof first === 'string') { meta.len1 = Math.min(first.length, 999999); }
        if (typeof second === 'string') { meta.len2 = Math.min(second.length, 999999); }
        log(stage, meta);
    } catch (ignored) {}
}
function version(parts, value) {
    try {
        var meta = {service: value};
        for (var i = 0; i < parts.length && i < 4; i++) { meta['v' + i] = scalar(parts[i]); }
        log('VER_OK', meta);
    } catch (ignored) {}
}
export default {log: log, fail: fail, version: version};
