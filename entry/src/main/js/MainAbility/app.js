import L from './common/logsink.js';
import logConfig from './common/log-config.js';

import wearService from './common/wearService.js';
import wearCompat from './common/wearCompat.js';
export default {
  _elctonWearChannel: wearService,
  _elctonWearCompat: function (identity, protocol, engine) { return wearCompat(identity, protocol, engine); },
  _elctonLog: function (stage, message) {
    try {
      if (typeof stage !== 'string' || !stage.length || stage.length > 29) return false;
      for (var i = 0; i < stage.length; i++) {
        var c = stage.charCodeAt(i);
        if (!(c >= 65 && c <= 90 || c >= 48 && c <= 57 || c === 95)) return false;
      }
      var text = '';
      var names = ['ok', 'code', 'count', 'bytes', 'attempt', 'ms', 'arg1', 'arg2', 'type1', 'type2', 'len1', 'len2', 'service', 'v0', 'v1', 'v2', 'v3'];
      for (var j = 0; message && typeof message === 'object' && j < names.length; j++) {
        var d = Object.getOwnPropertyDescriptor(message, names[j]);
        if (!d || !Object.prototype.hasOwnProperty.call(d, 'value')) continue;
        var value = d.value;
        if (j >= 6 && typeof value === 'string') {
          if (!value.length || value.length > 9) continue;
          var start = value.charAt(0) === '-' ? 1 : 0;
          var digits = start < value.length;
          for (var k = start; k < value.length; k++) {
            var digit = value.charCodeAt(k);
            if (digit < 48 || digit > 57) { digits = false; break; }
          }
          if (!digits) continue;
          value = Number(value);
        }
        if (!(j < 6 && typeof value === 'boolean') && !(typeof value === 'number' && isFinite(value) && Math.floor(value) === value && value >= -999999999 && value <= 999999999)) continue;
        text += (text ? ' ' : '') + names[j] + '=' + String(value);
      }
      L.i('WE/' + stage, text.slice(0, 160));
      return true;
    } catch (ignored) { return false; }
  },
  _elctonLogStatus: function () {
    try {
      var s = L.status();
      return { pending: s.pending, sent: s.sent, dropped: s.dropped, failed: s.failed, busy: s.busy, seq: s.seq };
    } catch (ignored) { return null; }
  },
  onCreate: function () {
    L.init(logConfig);
    L.page('MainAbility');

    console.info('Application onCreate');
  },
  onDestroy: function () {
    try {
      console.info('Application onDestroy');
    } finally {
      L.stop();
    }
  }
};