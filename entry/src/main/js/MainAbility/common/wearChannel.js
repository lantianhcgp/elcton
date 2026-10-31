/* Thin Lite API adapter. Based on the Apache-2.0 Huawei Wear Engine JS SDK calls.
 * No service-version guess controls correctness; unsupported methods fail explicitly.
 */
import engine from '@system.wearengine';
import protocol from './wearProtocol.js';
function channel(identity) {
    var open = false;
    var generation = 0;
    function close() { open = false; generation++; try { engine.unsubscribeMsg(); } catch (e) {} }
    return {
        open: function (onMessage, cb) {
            if (!identity || !/^[A-Za-z0-9_.]+$/.test(identity.phonePackage || '') || !/^[a-fA-F0-9]{64}$/.test(identity.phoneFingerprint || '')) { cb('INVALID_IDENTITY'); return; }
            var gen = ++generation;
            var finished = false;
            function finish(err) { if (finished || gen !== generation) { return; } finished = true; cb(err); }
            try {
                engine.setPackageName({appName: identity.phonePackage, fail: function () { finish('SET_PACKAGE'); }, complete: function () {
                    if (finished || gen !== generation) { return; }
                    engine.setFingerprint({appName: identity.phonePackage, appCert: identity.phoneFingerprint, fail: function () { finish('SET_FINGERPRINT'); }, complete: function () {
                        if (finished || gen !== generation) { return; }
                        engine.subscribeMsg({fail: function (d, code) { finish('REGISTER_' + code); }, success: function (data) {
                            if (gen !== generation) { return; }
                            if (!data || data.isRegister) { open = true; finish(null); return; }
                            if (data.isFileType || typeof data.message !== 'string' || data.message.length > 1024) { return; }
                            try { var msg = JSON.parse(data.message); if (msg.sender !== 'phone') { return; } } catch (e) { return; }
                            onMessage(data.message);
                        }});
                    }});
                }});
            } catch (e) { finish('CHANNEL_UNAVAILABLE'); }
        },
        send: function (message, cb) {
            var text;
            try { text = protocol.ascii(message); } catch (e) { if (cb) { cb('INVALID_PACKET'); } return; }
            if (!open || text.length > 1024) { if (cb) { cb('CHANNEL_CLOSED_OR_TOO_LARGE'); } return; }
            var gen=generation,finished=false;
            function finish(err) {if(finished||gen!==generation)return;finished=true;if(cb)cb(err);}
            try { engine.sendMsg({deviceId: 'remote', bundleName: identity.phonePackage, abilityName: '', message: text,
                success: function () { finish(null); }, fail: function (d, code) { finish('SEND_' + code); }}); }
            catch (e) { finish('SEND_UNAVAILABLE'); }
        },
        close: close
    };
}
export default channel;
