/* Page-scoped Lite Wearable request; does not change brightness value or mode. */
function makeAwake() {
    var brightness = null;
    var visible = false;
    var generation = 0;
    try { brightness = require('@system.brightness'); } catch (e) {}
    function stage(value) {
        try { console.info(value); } catch (e) {}
    }
    function request(value, gen) {
        var finished = false;
        function fail() {
            if (finished) { return; }
            finished = true;
            if (gen === generation) { stage('FAIL'); }
        }
        try {
            if (!brightness || typeof brightness.setKeepScreenOn !== 'function') { fail(); return; }
            brightness.setKeepScreenOn({keepScreenOn: value,
                success: function () {
                    if (finished) { return; }
                    finished = true;
                    if (gen !== generation) {
                        // Late native completion must match the latest page visibility.
                        if (value !== visible) { request(visible, generation); }
                        return;
                    }
                    stage(value ? 'KEEP_ON' : 'KEEP_OFF');
                },
                fail: fail});
        } catch (e) { fail(); }
    }
    return {
        show: function () {
            if (visible) { return; }
            visible = true;
            request(true, ++generation);
        },
        hide: function () {
            if (!visible) { return; }
            visible = false;
            request(false, ++generation);
        }
    };
}
export default makeAwake;
