/* Thin Lite API adapter. Based on the Apache-2.0 Huawei Wear Engine JS SDK calls.
 * No service-version guess controls correctness; unsupported methods fail explicitly.
 */
import engine from '@system.wearengine';
/* No-version compatibility adapter; versioned production transport lives in the app bundle. */
import protocol from './wearProtocol.js';
import trace from './wearTrace.js';
function channel(identity) {
    // The app owns versioned SDK negotiation; no-version compatibility keeps the old bounded path.
    if (typeof engine.getWearEngineVersion === 'function') {
        try { var app = $app.$def || $app; if (typeof app._elctonWearChannel === 'function') { return app._elctonWearChannel(identity, protocol, engine); } } catch (e) {}
        trace.log('SDK_UNAVAILABLE');
        return {open: function (onMessage, cb) { cb('APP_CHANNEL_UNAVAILABLE'); }, close: function () {}};
    }
    var open = false, generation = 0, marks = [], last = '';
    function mark(stage) {
        if (stage === 'PKG' || stage === 'CERT' || stage === 'REG') {
            if (marks.indexOf(stage) < 0 && marks.length < 3) { marks.push(stage); }
        } else { last = stage; }
    }
    function code(stage, value) {
        var n = typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= -999999999 && value <= 999999999 ? value : 0;
        return stage + '_' + n;
    }
    function close() { open = false; generation++; try { engine.unsubscribeMsg(); } catch (e) {} trace.log('CLOSE'); }
    return {
        open: function (onMessage, cb) {
            if (!identity || !protocol.id(identity.phonePackage || '', Infinity, '_.') || !protocol.hex(String(identity.phoneFingerprint || '').toLowerCase(), 64)) { cb('INVALID_IDENTITY'); return; }
            open = false; marks = []; last = ''; var gen = ++generation;
            var finished = false, failed = false;
            function live() { return gen === generation && !failed; }
            function finish(err) {
                if (finished || !live()) { return; } finished = true;
                if (err) { open = false; failed = true; mark(err); } cb(err);
            }
            trace.log('SDK_UNAVAILABLE'); trace.log('BUS_UNVERSIONED'); trace.log('PKG_CALL');
            try {
                engine.setPackageName({appName: identity.phonePackage, fail: function (d, c) {
                    if (finished || !live()) { return; } trace.fail('PKG_FAIL', d, c); finish('SET_PACKAGE');
                }, complete: function () {
                    if (finished || !live()) { return; } mark('PKG'); trace.log('PKG_OK'); trace.log('CERT_CALL');
                    try { engine.setFingerprint({appName: identity.phonePackage, appCert: identity.phoneFingerprint, fail: function (d, c) {
                        if (finished || !live()) { return; } trace.fail('CERT_FAIL', d, c); finish('SET_FINGERPRINT');
                    }, complete: function () {
                        if (finished || !live()) { return; } mark('CERT'); trace.log('CERT_OK'); trace.log('REG_CALL');
                        try { engine.subscribeMsg({fail: function (d, c) {
                            if (!live()) { return; }
                            open = false; failed = true; generation++; finished = true;
                            trace.fail('REG_FAIL', d, c); var err = code('REGISTER', c); mark(err); cb(err);
                        }, success: function (data) {
                            if (!live()) { return; }
                            if (!data || data.isRegister) { if (finished) { return; } open = true; mark('REG'); trace.log('REG_OK'); finish(null); return; }
                            if (!open || data.isFileType || typeof data.message !== 'string' || data.message.length > 1024) { return; }
                            try { var msg = JSON.parse(data.message); if (!msg || msg.sender !== 'phone') { return; } } catch (e) { return; }
                            onMessage(data.message);
                        }}); } catch (e) { trace.log('REG_FAIL'); finish('CHANNEL_UNAVAILABLE'); }
                    }}); } catch (e) { trace.log('CERT_FAIL'); finish('CHANNEL_UNAVAILABLE'); }
                }});
            } catch (e) { trace.log('PKG_FAIL'); finish('CHANNEL_UNAVAILABLE'); }
        },
        send: function (message, cb) {
            var text;
            try { text = protocol.ascii(message); } catch (e) { if (cb) { cb('INVALID_PACKET'); } return; }
            if (!open || text.length > 1024) { if (cb) { cb('CHANNEL_CLOSED_OR_TOO_LARGE'); } return; }
            var gen = generation, finished = false, ready = message.type === 'READY';
            function finish(err, d, c) {
                if (finished || gen !== generation) { return; } finished = true;
                if (err) { trace.fail('SEND_FAIL', d, c, err === 'SEND_206' ? 206 : undefined); if (ready) { trace.fail('READY_FAIL', d, c, err === 'SEND_206' ? 206 : undefined); } }
                else { trace.log('SEND_OK', {code: 207}); if (ready) { trace.log('READY_OK', {code: 207}); } }
                if (ready || err) { mark(err || 'READY_OK'); }
                if (cb) { cb(err); }
            }
            if (ready) { trace.log('READY_CALL', {bytes: text.length}); } trace.log('SEND_CALL', {bytes: text.length});
            try { engine.sendMsg({deviceId: 'remote', bundleName: identity.phonePackage, abilityName: '', message: text,
                success: function () { finish(null); }, fail: function (d, c) { finish('SEND_206', d, c); }}); }
            catch (e) { finish('SEND_UNAVAILABLE'); }
        },
        close: close,
        isNegotiated: function () { return false; },
        summary: function () { return 'UNVERSIONED' + (marks.length ? '|' + marks.join('|') : '') + (last ? '|' + last : ''); }
    };
}
export default channel;
