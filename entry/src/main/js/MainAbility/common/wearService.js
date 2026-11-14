/* Callback-only Huawei JS SDK 5.0.2.306 adaptation.
 * App bundle owns this factory so the 48KiB receive page does not duplicate it.
 * Caller supplies the existing ASCII/identity codec; no schedule or private text is logged.
 */
import trace from './wearTrace.js';
function service(identity, protocol, engine) {
    var open = false, generation = 0, bus = null, registered = false, negotiated = false;
    var marks = [], last = '', serviceVersion = 0;
    function mark(stage) {
        if (stage === 'VER' || stage === 'PKG' || stage === 'CERT' || stage === 'REG') {
            if (marks.indexOf(stage) < 0 && marks.length < 4) { marks.push(stage); }
        } else { last = stage; }
    }
    function code(stage, value) {
        var n = typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= -999999999 && value <= 999999999 ? value : 0;
        return stage + '_' + n;
    }
    function close() {
        open = false; generation++; negotiated = false;
        if (bus && registered) { try { bus.unsubscribeMsg(); } catch (e) {} }
        registered = false; bus = null; trace.log('CLOSE');
    }
    return {
        open: function (onMessage, cb) {
            if (!identity || !protocol.id(identity.phonePackage || '', Infinity, '_.') || !protocol.hex(String(identity.phoneFingerprint || '').toLowerCase(), 64)) { cb('INVALID_IDENTITY'); return; }
            close(); marks = []; last = ''; serviceVersion = 0;
            var gen = ++generation, finished = false, failed = false, versionSettled = false;
            function live() { return gen === generation && !failed; }
            function finish(err) {
                if (finished || !live()) { return; }
                finished = true; if (err) { open = false; negotiated = false; failed = true; mark(err); } cb(err);
            }
            function configure() {
                try {
                    function fingerprint() {
                        if (finished || !live()) { return; }
                        trace.log('CERT_CALL');
                        try { engine.setFingerprint({appName: identity.phonePackage, appCert: identity.phoneFingerprint,
                            fail: function (d, c) { if (finished || !live()) { return; } trace.fail('CERT_FAIL', d, c); finish(code('CERT', c)); }, complete: function () {
                                if (finished || !live()) { return; } mark('CERT'); trace.log('CERT_OK'); subscribe();
                            }}); } catch (e) { trace.log('CERT_FAIL'); finish('CONFIG_UNAVAILABLE'); }
                    }
                    if (serviceVersion >= 303) {
                        trace.log('PKG_CALL');
                        engine.setPackageName({appName: identity.phonePackage,
                            fail: function (d, c) { if (finished || !live()) { return; } trace.fail('PKG_FAIL', d, c); finish(code('PKG', c)); }, complete: function () {
                                if (finished || !live()) { return; } mark('PKG'); trace.log('PKG_OK'); fingerprint();
                            }});
                    } else { fingerprint(); }
                } catch (e) { trace.log('PKG_FAIL'); finish('CONFIG_UNAVAILABLE'); }
            }
            function subscribe() {
                if (finished || !live()) { return; }
                trace.log('REG_CALL');
                try {
                    if (serviceVersion >= 401) { bus.unsubscribeMsg(); }
                    registered = true;
                    bus.subscribeMsg({fail: function (d, c) {
                        if (!live()) { return; }
                        open = false; negotiated = false; failed = true; generation++;
                        trace.fail('REG_FAIL', d, c); var err = code('REG', c); mark(err);
                        finished = true; cb(err);
                    }, success: function (data) {
                        if (!live()) { return; }
                        if (!data || data.isRegister) {
                            if (finished) { return; } open = true; negotiated = true; mark('REG'); trace.log('REG_OK'); finish(null); return;
                        }
                        if (!open || data.isFileType || typeof data.message !== 'string' || data.message.length > 1024) { return; }
                        var msg; try { msg = JSON.parse(data.message); } catch (e) { return; }
                        if (!msg || msg.sender !== 'phone') { return; }
                        onMessage(data.message);
                    }});
                } catch (e) { trace.log('REG_FAIL'); finish('REGISTER_UNAVAILABLE'); }
            }
            trace.log('SDK_CALL');
            try {
                engine.getWearEngineVersion({sdkVersion: '3', complete: function (data) {
                    if (finished || !live() || versionSettled) { return; } versionSettled = true;
                    if (typeof data !== 'string' || data.length > 40) { trace.log('VER_FAIL'); finish('VERSION_INVALID'); return; }
                    var parts = data.split('.'), valid = parts.length >= 1 && parts.length <= 4;
                    for (var i = 0; i < parts.length; i++) {
                        if (!parts[i]) { valid = false; }
                        for (var j = 0; j < parts[i].length; j++) { if (parts[i].charCodeAt(j) < 48 || parts[i].charCodeAt(j) > 57) { valid = false; } }
                    }
                    var value = Number(parts[parts.length - 1]);
                    if (!valid || !isFinite(value) || Math.floor(value) !== value || value < 302) { trace.log('VER_FAIL'); finish('VERSION_UNSUPPORTED'); return; }
                    serviceVersion = value; mark('VER'); trace.version(parts, value);
                    if (value >= 401) { bus = engine; trace.log('BUS_NATIVE'); }
                    else if (typeof FeatureAbility !== 'undefined') { bus = FeatureAbility; trace.log('BUS_LEGACY'); }
                    if (!bus || typeof bus.subscribeMsg !== 'function' || typeof bus.sendMsg !== 'function' || typeof bus.unsubscribeMsg !== 'function') { finish('BUS_UNAVAILABLE'); return; }
                    configure();
                }});
            } catch (e) { trace.log('SDK_UNAVAILABLE'); finish('VERSION_UNAVAILABLE'); }
        },
        send: function (message, cb) {
            var text; try { text = protocol.ascii(message); } catch (e) { if (cb) { cb('INVALID_PACKET'); } return; }
            if (!open || !bus || text.length > 1024) { if (cb) { cb('CHANNEL_CLOSED_OR_TOO_LARGE'); } return; }
            var gen = generation, finished = false, ready = message.type === 'READY';
            function finish(err, d, c) {
                if (finished || gen !== generation) { return; } finished = true;
                if (err) { trace.fail('SEND_FAIL', d, c, err === 'SEND_206' ? 206 : undefined); if (ready) { trace.fail('READY_FAIL', d, c, err === 'SEND_206' ? 206 : undefined); } }
                else { trace.log('SEND_OK', {code: 207}); if (ready) { trace.log('READY_OK', {code: 207}); } }
                if (ready || err) { mark(err || 'READY_OK'); }
                if (cb) { cb(err); }
            }
            if (ready) { trace.log('READY_CALL', {bytes: text.length}); }
            trace.log('SEND_CALL', {bytes: text.length});
            try { bus.sendMsg({deviceId: 'remote', bundleName: identity.phonePackage, abilityName: '', message: text,
                success: function () { finish(null); }, fail: function (d, c) { finish('SEND_206', d, c); }}); }
            catch (e) { finish('SEND_UNAVAILABLE'); }
        },
        close: close,
        isNegotiated: function () { return negotiated && open; },
        summary: function () { return 'SDK' + serviceVersion + '|' + marks.join('|') + (last ? '|' + last : ''); }
    };
}
export default service;
