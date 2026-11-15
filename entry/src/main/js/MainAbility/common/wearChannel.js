/* Thin Lite API adapter. Based on the Apache-2.0 Huawei Wear Engine JS SDK calls.
 * No service-version guess controls correctness; unsupported methods fail explicitly.
 */
import engine from '@system.wearengine';
/* No-version compatibility adapter; versioned production transport lives in the app bundle. */
import protocol from './wearProtocol.js';
import compat from './wearCompat.js';
import trace from './wearTrace.js';
function channel(identity) {
    // The app owns versioned SDK negotiation; no-version compatibility keeps the old bounded path.
    if (typeof engine.getWearEngineVersion === 'function') {
        try { var app = $app.$def || $app; if (typeof app._elctonWearChannel === 'function') { return app._elctonWearChannel(identity, protocol, engine); } } catch (e) {}
        trace.log('SDK_UNAVAILABLE');
        return {open: function (onMessage, cb) { cb('APP_CHANNEL_UNAVAILABLE'); }, close: function () {}};
    }
    return compat(identity, protocol, engine);
}
export default channel;
