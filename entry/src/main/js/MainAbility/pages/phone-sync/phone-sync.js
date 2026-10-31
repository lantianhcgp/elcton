import device from '@system.device';
import systemFile from '@system.file';
import router from '../../common/router.js';
import fs from '../../common/fs.js';
import store from '../../common/store.js';
import protocol from '../../common/wearProtocol.js';
import makeJournal from '../../common/wearJournal.js';
import makeReceiver from '../../common/wearReceiver.js';
import makeChannel from '../../common/wearChannel.js';
import identity from '../../common/wearIdentity.js';
import layout from '../../common/wearLayout.js';
import makeExporter from '../../common/wearExporter.js';

var TEMP_URI = 'internal://app/we-incoming.json';
export default {
    data: {
        ready: false, listening: false, phase: 'idle',
        title: '\u624b\u673a\u540c\u6b65', status: '\u8bf7\u5728\u624b\u673a\u53d1\u8d77\u540c\u6b65',
        detail: '\u5148\u70b9\u5f00\u59cb\u63a5\u6536\uff0c\u4fdd\u6301\u6b64\u9875\u6253\u5f00',
        buttonLabel: '\u5f00\u59cb\u63a5\u6536', courseCount: 0,
        pageW: 0, pageH: 0, side: 0, top: 0, bottom: 0, headerH: 0, bodyW: 0, bodyH: 0,
        footerH: 0, titleSize: 20, textSize: 18, buttonW: 0, gap: 0
    },
    onInit: function () {
        this._closed = false; this._gen = 0; this._timer = null; this._channel = null;
        var self = this;
        try { device.getInfo({success: function (info) {
            if (self._closed) { return; }
            try {
                var box = layout(info);
                for (var key in box) { if (Object.prototype.hasOwnProperty.call(box, key)) { self[key] = box[key]; } }
                self.ready = true;
            } catch (e) { self.status = '\u5c4f\u5e55\u4fe1\u606f\u65e0\u6548'; }
        }, fail: function () { self.status = '\u83b7\u53d6\u5c4f\u5e55\u5931\u8d25\uff0c\u8bf7\u8fd4\u56de\u91cd\u8bd5'; }}); }
        catch (e) { self.status = '\u8bbe\u5907\u63a5\u53e3\u4e0d\u53ef\u7528'; }
        self._journal = makeJournal({read: fs.readFile, write: fs.writeFile});
    },
    watchDog: function () {
        if (this._timer) { clearTimeout(this._timer); }
        var self = this;
        this._timer = setTimeout(function () {
            if (self._closed || !self.listening) { return; }
            self.stop(); self.phase = 'error';
            self.status = '\u7b49\u5f85\u8d85\u65f6'; self.detail = '\u65e7\u8bfe\u8868\u5df2\u4fdd\u7559\uff0c\u53ef\u91cd\u8bd5';
        }, 30000);
    },
    onListen: function () {
        if (!this.ready || this._closed) { return; }
        if (this.listening) { this.stop(); this.phase = 'idle'; this.status = '\u5df2\u53d6\u6d88'; this.detail = '\u65e7\u8bfe\u8868\u5df2\u4fdd\u7559\uff0c\u53ef\u91cd\u65b0\u5f00\u59cb'; return; }
        this.stop();
        var self = this;
        var gen = this._gen;
        var localSettings = null;
        var journal = this._journal;
        var storage = {
            load: function (cb) {
                journal.load(function (err, record) {
                    if (err || record) { cb(err, record); return; }
                    fs.readFile(store.URI, function (code, text) {
                        if (code === 301) { cb(null, null); return; }
                        if (code) { cb(code); return; }
                        var old = store.parseDoc(text);
                        if (!old || old.version !== 1) { cb('INVALID_LOCAL_DOC'); return; }
                        localSettings = old.settings;
                        if (old.courses.length === 0) { cb(null, null); return; }
                        cb(null, {text: text, meta: {datasetId: '', sourceRevision: 0, appliedDigest: '', localDirty: true}, generation: 0});
                    });
                });
            },
            reset: function (cb) { fs.writeFile(TEMP_URI, '', cb); },
            append: function (seq, text, cb) {
                try { systemFile.writeText({uri: TEMP_URI, text: text, append: true,
                    success: function () { cb(null); }, fail: function (d, code) { cb(code || 300); }}); }
                catch (e) { cb(300); }
            },
            commit: function (text, meta, cb) {
                if (self._closed || gen !== self._gen) { cb('CANCELLED'); return; }
                fs.readFile(TEMP_URI, function (err, saved) {
                    if (self._closed || gen !== self._gen) { cb('CANCELLED'); return; }
                    if (err || saved !== text) { cb(err || 'VERIFY_INCOMING'); return; }
                    journal.load(function (loadErr, current) {
                        if (self._closed || gen !== self._gen) { cb('CANCELLED'); return; }
                        if (loadErr) { cb(loadErr); return; }
                        var preferences = current && current.meta.localSettings ? current.meta.localSettings : localSettings;
                        meta.localSettings = preferences || {vibrationEnabled: true, reminderMinutes: 5};
                        meta.updatedAt = new Date().getTime();
                        journal.commit(text, meta, cb, function () { return !self._closed && gen === self._gen; });
                    });
                });
            }
        };
        this._receiver = makeReceiver(storage, {maxBytes: 8192});
        this._exporter = makeExporter(function(cb) { store.load(cb); });
        this._channel = makeChannel(identity);
        this.listening = true; this.phase = 'opening'; this.buttonLabel = '\u53d6\u6d88';
        this.status = '\u6b63\u5728\u8fde\u63a5'; this.detail = '\u624b\u673a\u9700\u4fdd\u6301\u524d\u53f0';
        this.watchDog();
        this._channel.open(function (raw) {
            if (self._closed || gen !== self._gen) { return; }
            self.watchDog();
            var message;
            try { message = JSON.parse(raw); } catch (e) { return; }
            if (!message || message.protocol !== 'elcton.sync' || message.version !== 1 || typeof message.type !== 'string') { return; }
            if (message.type === 'BEGIN') { self.phase = 'receiving'; self.status = '\u6b63\u5728\u63a5\u6536'; }
            if (message.type === 'END') { self.phase = 'saving'; self.status = '\u6821\u9a8c\u4fdd\u5b58\u4e2d'; }
            var target = self._receiver;
            if (message.type.substr(0,7) === 'EXPORT_') {
                if (self._receiver.isBusy()) { return; }
                target = self._exporter;
                self.phase = 'exporting'; self.status = '\u6b63\u5728\u56de\u4f20\u8bfe\u8868';
            } else if (self._exporter.isActive()) { return; }
            target.receive(raw, function (response) {
                if (self._closed || gen !== self._gen) { return; }
                self._channel.send(response, function (err) { if (err) { self.detail = '\u56de\u6267\u53d1\u9001\u5931\u8d25\uff0c\u8bf7\u624b\u673a\u91cd\u8bd5'; }});
                if (response.type === 'EXPORT_CLOSED') {
                    self.phase = 'ready'; self.status = '\u8bfe\u8868\u5df2\u56de\u4f20'; self.detail = '\u8bf7\u5728\u624b\u673a\u9884\u89c8\u540e\u5bfc\u5165';
                } else if (response.type === 'EXPORT_META' || response.type === 'EXPORT_CHUNK') {
                    self.detail = '\u8bfe\u8868\u56de\u4f20\u4e2d\uff0c\u672a\u6539\u53d8\u624b\u673a\u5185\u5bb9';
                } else if (response.type === 'APPLIED') {
                    self.phase = 'applied'; self.status = '\u540c\u6b65\u5b8c\u6210';
                    self.detail = '\u5df2\u4fdd\u5b58\u5e76\u56de\u8bfb\u786e\u8ba4';
                    if (self._timer) { clearTimeout(self._timer); self._timer = null; }
                } else if (response.type === 'ERROR') {
                    self.phase = 'error'; self.status = response.code === 'CONFLICT' ? '\u8bf7\u624b\u673a\u786e\u8ba4\u8986\u76d6' : '\u540c\u6b65\u5931\u8d25';
                    self.detail = String(response.code).substr(0, 48);
                } else if (response.type === 'ACK' && response.seq >= 0) {
                    self.detail = '\u5df2\u63a5\u6536\u7b2c ' + (response.seq + 1) + ' \u5305';
                }
            });
        }, function (err) {
            if (self._closed || gen !== self._gen) { return; }
            if (err) { self.stop(); self.phase = 'error'; self.status = '\u8fde\u63a5\u5931\u8d25'; self.detail = String(err); return; }
            self.phase = 'ready'; self.status = '\u7b49\u5f85\u624b\u673a';
            self._receiver.receive(protocol.ascii({protocol: 'elcton.sync', version: 1, sender: 'phone', type: 'HELLO', transferId: ''}), function (response) {
                if (!self._closed && gen === self._gen) { self._channel.send(response); }
            });
        });
    },
    stop: function () {
        this._gen++;
        if (this._timer) { clearTimeout(this._timer); this._timer = null; }
        if (this._exporter) { this._exporter.cancel(); this._exporter = null; }
        if (this._receiver) { this._receiver.cancel(); this._receiver = null; }
        if (this._channel) { this._channel.close(); this._channel = null; }
        this.listening = false; this.buttonLabel = '\u5f00\u59cb\u63a5\u6536';
    },
    onBack: function () { this.stop(); router.push({uri: 'pages/week/week'}); },
    onLegacy: function () { this.stop(); router.push({uri: 'pages/sync/sync'}); },
    onHide: function () { this.stop(); },
    onDestroy: function () { this._closed = true; this.stop(); }
};
