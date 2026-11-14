/* Callback-only Huawei JS SDK 5.0.2.306 adaptation.
 * App bundle owns this factory so the 48KiB receive page does not duplicate it.
 * Caller supplies the existing ASCII/identity codec; no schedule or private text is logged.
 */
function service(identity, protocol, engine) {
    var open = false, generation = 0, bus = null, registered = false, negotiated = false;
    var marks = [], serviceVersion = 0;
    function mark(stage) {
        marks.push(stage); if (marks.length > 6) { marks.shift(); }
        try { console.info('WE ' + marks.join('|')); } catch (e) {}
    }
    function code(stage, value) {
        var n = typeof value === 'number' && isFinite(value) ? value : 0;
        return stage + '_' + n;
    }
    function close() {
        open = false; generation++; negotiated = false;
        if (bus && registered) { try { bus.unsubscribeMsg(); } catch (e) {} }
        registered = false; bus = null;
    }
    return {
        open: function (onMessage, cb) {
            if (!identity || !protocol.id(identity.phonePackage || '', Infinity, '_.') || !protocol.hex(String(identity.phoneFingerprint || '').toLowerCase(), 64)) { cb('INVALID_IDENTITY'); return; }
            close(); marks = []; serviceVersion = 0;
            var gen = ++generation, finished = false, versionSettled = false;
            function live() { return gen === generation; }
            function finish(err) {
                if (finished || !live()) { return; }
                finished = true; if (err) { mark(err); } cb(err);
            }
            function configure() {
                try {
                    function fingerprint() {
                        if (finished || !live()) { return; }
                        try { engine.setFingerprint({appName: identity.phonePackage, appCert: identity.phoneFingerprint,
                            fail: function (d, c) { finish(code('CERT', c)); }, complete: function () {
                                if (finished || !live()) { return; } mark('CERT'); subscribe();
                            }}); } catch (e) { finish('CONFIG_UNAVAILABLE'); }
                    }
                    if (serviceVersion >= 303) {
                        engine.setPackageName({appName: identity.phonePackage,
                            fail: function (d, c) { finish(code('PKG', c)); }, complete: function () {
                                if (finished || !live()) { return; } mark('PKG'); fingerprint();
                            }});
                    } else { fingerprint(); }
                } catch (e) { finish('CONFIG_UNAVAILABLE'); }
            }
            function subscribe() {
                if (finished || !live()) { return; }
                try {
                    if (serviceVersion >= 401) { bus.unsubscribeMsg(); }
                    registered = true;
                    bus.subscribeMsg({fail: function (d, c) {
                        if (!live()) { return; } open = false;
                        if (!finished) { finish(code('REG', c)); }
                        else { mark(code('REG', c)); cb(code('REG', c)); }
                    }, success: function (data) {
                        if (!live()) { return; }
                        if (!data || data.isRegister) {
                            if (finished) { return; } open = true; negotiated = true; mark('REG'); finish(null); return;
                        }
                        if (!open || data.isFileType || typeof data.message !== 'string' || data.message.length > 1024) { return; }
                        var msg; try { msg = JSON.parse(data.message); } catch (e) { return; }
                        if (!msg || msg.sender !== 'phone') { return; }
                        if (msg.type === 'HELLO') { mark('HELLO'); }
                        onMessage(data.message);
                    }});
                } catch (e) { finish('REGISTER_UNAVAILABLE'); }
            }
            try {
                engine.getWearEngineVersion({sdkVersion: '3', complete: function (data) {
                    if (finished || !live() || versionSettled) { return; } versionSettled = true;
                    if (typeof data !== 'string' || data.length > 40) { finish('VERSION_INVALID'); return; }
                    var parts = data.split('.'), valid = parts.length === 4;
                    for (var i = 0; i < parts.length; i++) {
                        if (!parts[i]) { valid = false; }
                        for (var j = 0; j < parts[i].length; j++) { if (parts[i].charCodeAt(j) < 48 || parts[i].charCodeAt(j) > 57) { valid = false; } }
                    }
                    var value = Number(parts[3]);
                    if (!valid || !isFinite(value) || Math.floor(value) !== value || value < 302) { finish('VERSION_UNSUPPORTED'); return; }
                    serviceVersion = value; mark('VER');
                    if (value >= 401) { bus = engine; }
                    else if (typeof FeatureAbility !== 'undefined') { bus = FeatureAbility; }
                    if (!bus || typeof bus.subscribeMsg !== 'function' || typeof bus.sendMsg !== 'function' || typeof bus.unsubscribeMsg !== 'function') { finish('BUS_UNAVAILABLE'); return; }
                    configure();
                }});
            } catch (e) { finish('VERSION_UNAVAILABLE'); }
        },
        send: function (message, cb) {
            var text; try { text = protocol.ascii(message); } catch (e) { if (cb) { cb('INVALID_PACKET'); } return; }
            if (!open || !bus || text.length > 1024) { if (cb) { cb('CHANNEL_CLOSED_OR_TOO_LARGE'); } return; }
            var gen = generation, finished = false;
            function finish(err) {
                if (finished || gen !== generation) { return; } finished = true;
                if (message.type === 'READY' || err) { mark(err || 'READY_OK'); }
                if (cb) { cb(err); }
            }
            try { bus.sendMsg({deviceId: 'remote', bundleName: identity.phonePackage, abilityName: '', message: text,
                success: function () { finish(null); }, fail: function (d, c) { finish(code('SEND', c)); }}); }
            catch (e) { finish('SEND_UNAVAILABLE'); }
        },
        close: close,
        isNegotiated: function () { return negotiated && open; },
        summary: function () { return 'SDK' + serviceVersion + '|' + marks.join('|'); }
    };
}
export default service;
