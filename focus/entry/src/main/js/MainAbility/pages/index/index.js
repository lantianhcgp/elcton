import storage from '@system.storage';
import vibrator from '@system.vibrator';

var STAT_KEY = 'focus_stat';
var RUN_KEY = 'focus_run';

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

function todayKey() {
  var d = new Date();
  return '' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate());
}

function vibrateShort() {
  vibrator.vibrate({
    mode: 'short',
    success: function () {},
    fail: function (data, code) {
      console.error('vibrate failed: ' + code);
    }
  });
}

export default {
  data: {
    timeText: '25:00',
    statusText: '\u5c31\u7eea',
    statusColor: '#8e8ea0',
    toggleText: '\u5f00\u59cb',
    barWidth: '0%',
    todayText: '\u4eca\u65e5 0 \u5206\u949f',
    presets: [
      { id: 'p15', min: 15, label: '', bg: '#1a1a2e', fg: '#8e8ea0' },
      { id: 'p25', min: 25, label: '', bg: '#6c63ff', fg: '#ffffff' },
      { id: 'p45', min: 45, label: '', bg: '#1a1a2e', fg: '#8e8ea0' }
    ]
  },
  onInit: function () {
    this.state = 'idle';
    this.selMin = 25;
    this.totalMs = 1500000;
    this.remainMs = 1500000;
    this.endTime = 0;
    this.timerId = null;
    this.todayMin = 0;
    this.vibBusy = false;
    this.vibTimers = [];
    this.presets[0].label = this.$t('strings.p15');
    this.presets[1].label = this.$t('strings.p25');
    this.presets[2].label = this.$t('strings.p45');
    this.loadStat();
    this.restoreRun();
  },
  onShow: function () {
    if (this.state === 'running') {
      var rem = this.endTime - Date.now();
      if (rem <= 0) {
        this.finish(true);
      } else {
        this.remainMs = rem;
        this.render();
        this.startTick();
      }
    }
  },
  onHide: function () {
    if (this.state === 'running') {
      this.stopTick();
    }
  },
  onDestroy: function () {
    this.stopTick();
    this.clearVibTimers();
    if (this.state === 'running' || this.state === 'paused') {
      this.saveRun();
    }
  },
  setStatus: function (text, color) {
    this.statusText = text;
    this.statusColor = color;
  },
  setToggle: function (text) {
    this.toggleText = text;
  },
  renderTime: function () {
    var s = Math.ceil(this.remainMs / 1000);
    if (s < 0) { s = 0; }
    var m = Math.floor(s / 60);
    if (m > 99) { m = 99; s = m * 60; }
    this.timeText = pad2(m) + ':' + pad2(s - m * 60);
  },
  renderBar: function () {
    var pct = 0;
    if (this.totalMs > 0) {
      pct = Math.floor((this.totalMs - this.remainMs) * 100 / this.totalMs);
    }
    if (pct < 0) { pct = 0; }
    if (pct > 100) { pct = 100; }
    this.barWidth = pct + '%';
  },
  render: function () {
    this.renderTime();
    this.renderBar();
  },
  renderToday: function () {
    this.todayText = '\u4eca\u65e5 ' + this.todayMin + ' \u5206\u949f';
  },
  startTick: function () {
    this.stopTick();
    var self = this;
    this.timerId = setInterval(function () { self.tick(); }, 500);
  },
  stopTick: function () {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  },
  tick: function () {
    var rem = this.endTime - Date.now();
    if (rem <= 0) {
      this.finish(true);
      return;
    }
    this.remainMs = rem;
    this.render();
  },
  toggle: function () {
    if (this.state === 'running') {
      this.pause();
    } else {
      this.start();
    }
  },
  start: function () {
    if (this.state === 'done') {
      this.remainMs = this.totalMs;
    }
    if (this.remainMs <= 0) {
      this.remainMs = this.totalMs;
    }
    this.endTime = Date.now() + this.remainMs;
    this.state = 'running';
    this.setStatus('\u8fdb\u884c\u4e2d', '#6c63ff');
    this.setToggle('\u6682\u505c');
    this.render();
    this.saveRun();
    this.startTick();
  },
  pause: function () {
    var rem = this.endTime - Date.now();
    if (rem < 0) { rem = 0; }
    this.remainMs = rem;
    this.stopTick();
    this.state = 'paused';
    this.setStatus('\u5df2\u6682\u505c', '#ffc107');
    this.setToggle('\u7ee7\u7eed');
    this.render();
    this.saveRun();
  },
  reset: function () {
    this.stopTick();
    this.state = 'idle';
    this.remainMs = this.totalMs;
    this.setStatus('\u5c31\u7eea', '#8e8ea0');
    this.setToggle('\u5f00\u59cb');
    this.render();
    this.clearRun();
  },
  finish: function (doVibe) {
    this.stopTick();
    this.state = 'done';
    this.remainMs = 0;
    this.todayMin += this.selMin;
    this.setStatus('\u5b8c\u6210', '#4caf50');
    this.setToggle('\u518d\u6765\u4e00\u6b21');
    this.render();
    this.renderToday();
    this.saveStat();
    this.clearRun();
    if (doVibe) {
      this.vibrateDone();
    }
  },
  vibrateDone: function () {
    if (this.vibBusy) { return; }
    this.vibBusy = true;
    var self = this;
    vibrateShort();
    this.vibTimers.push(setTimeout(function () { vibrateShort(); }, 320));
    this.vibTimers.push(setTimeout(function () { vibrateShort(); }, 640));
    this.vibTimers.push(setTimeout(function () { self.vibBusy = false; }, 1000));
  },
  clearVibTimers: function () {
    for (var i = 0; i < this.vibTimers.length; i++) {
      clearTimeout(this.vibTimers[i]);
    }
    this.vibTimers = [];
    this.vibBusy = false;
  },
  pick: function (m) {
    if (this.state === 'running' || this.state === 'paused') { return; }
    this.applyPreset(m, true);
  },
  applyPreset: function (m, updateUi) {
    this.selMin = m;
    this.totalMs = m * 60000;
    this.remainMs = this.totalMs;
    for (var i = 0; i < this.presets.length; i++) {
      if (this.presets[i].min === m) {
        this.presets[i].bg = '#6c63ff';
        this.presets[i].fg = '#ffffff';
      } else {
        this.presets[i].bg = '#1a1a2e';
        this.presets[i].fg = '#8e8ea0';
      }
    }
    if (updateUi) {
      this.state = 'idle';
      this.setStatus('\u5c31\u7eea', '#8e8ea0');
      this.setToggle('\u5f00\u59cb');
      this.render();
      this.clearRun();
    }
  },
  loadStat: function () {
    var self = this;
    storage.get({
      key: STAT_KEY,
      default: '',
      success: function (value) {
        var parts = (value || '').split('|');
        var n = 0;
        if (parts.length === 2 && parts[0] === todayKey()) {
          n = parseInt(parts[1], 10);
          if (isNaN(n) || n < 0) { n = 0; }
        }
        self.todayMin = n;
        self.renderToday();
      },
      fail: function () {
        self.todayMin = 0;
        self.renderToday();
      }
    });
  },
  saveStat: function () {
    storage.set({
      key: STAT_KEY,
      value: todayKey() + '|' + this.todayMin,
      fail: function (data, code) {
        console.error('stat save failed: ' + code);
      }
    });
  },
  saveRun: function () {
    var payload = '';
    if (this.state === 'running') {
      payload = 'r|' + this.endTime + '|' + this.selMin;
    } else if (this.state === 'paused') {
      payload = 'p|' + this.remainMs + '|' + this.selMin;
    }
    if (payload === '') {
      this.clearRun();
      return;
    }
    storage.set({
      key: RUN_KEY,
      value: payload,
      fail: function (data, code) {
        console.error('run save failed: ' + code);
      }
    });
  },
  clearRun: function () {
    storage.delete({
      key: RUN_KEY,
      fail: function () {}
    });
  },
  restoreRun: function () {
    var self = this;
    storage.get({
      key: RUN_KEY,
      default: '',
      success: function (value) {
        if (!value) { return; }
        var parts = value.split('|');
        if (parts.length !== 3) { self.clearRun(); return; }
        var mode = parts[0];
        var amount = parseInt(parts[1], 10);
        var minutes = parseInt(parts[2], 10);
        if (isNaN(amount) || isNaN(minutes)) { self.clearRun(); return; }
        if (minutes !== 15 && minutes !== 25 && minutes !== 45) { self.clearRun(); return; }
        self.applyPreset(minutes, false);
        if (mode === 'r') {
          if (amount > Date.now()) {
            self.state = 'running';
            self.endTime = amount;
            self.remainMs = amount - Date.now();
            self.setStatus('\u8fdb\u884c\u4e2d', '#6c63ff');
            self.setToggle('\u6682\u505c');
            self.render();
            self.startTick();
          } else {
            self.clearRun();
          }
        } else if (mode === 'p') {
          if (amount > 0) {
            self.state = 'paused';
            self.remainMs = amount;
            self.setStatus('\u5df2\u6682\u505c', '#ffc107');
            self.setToggle('\u7ee7\u7eed');
            self.render();
          } else {
            self.clearRun();
          }
        } else {
          self.clearRun();
        }
      },
      fail: function () {}
    });
  }
};
