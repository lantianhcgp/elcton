import router from '../../common/router.js';

/* LAN 可达性探测（课程表同步功能的前置实测）
 * 候选地址顺序：手机 Wi-Fi 内网（目标）→ 手表本机（对照，预期失败）→ 公网 HTTP（对照）→ 公网 HTTPS（对照）
 * 串行执行 + 每条 6s 看门狗：lite 真机并发 fetch 会卡死，回调也可能不回来（参照签到 app 实测经验）
 */
var PROBES = [
    { name: '\u624b\u673a\u5185\u7f51 :8123', url: 'http://192.168.1.200:8123/t.json', key: 'lan' },
    { name: '\u8868\u672c\u673a 127.0.0.1', url: 'http://127.0.0.1:8123/t.json', key: 'self' },
    { name: '\u516c\u7f51 HTTP', url: 'http://connect.rom.miui.com/generate_204', key: 'net' },
    { name: '\u516c\u7f51 HTTPS', url: 'https://ws.fseatech.cn/', key: 'https' }
];
var WATCHDOG_MS = 6000;

export default {
    data: {
        probes: [],
        detail: ''
    },
    onInit: function () {
        this.reset();
        this.runAll();
    },
    reset: function () {
        var list = [];
        for (var i = 0; i < PROBES.length; i++) {
            list.push({ name: PROBES[i].name, status: '\u5f85\u6d4b', color: '#6c6c80' });
        }
        this.probes = list;
        this.detail = '';
    },
    onRun: function () {
        this.reset();
        this.runAll();
    },
    onBack: function () {
        router.back();
    },
    runAll: function () {
        var self = this;
        var f = null;
        try { f = require('@system.fetch'); } catch (e) { f = null; }
        if (!f || !f.fetch) {
            self.markAll('\u8054\u7f51\u6a21\u5757\u4e0d\u53ef\u7528', '#f44336');
            self.detail = '@system.fetch \u52a0\u8f7d\u5931\u8d25\uff08\u672a\u58f0\u660e\u6743\u9650\u6216\u8fd0\u884c\u65f6\u4e0d\u652f\u6301\uff09';
            return;
        }
        self.idx = 0;
        self.fetchApi = f;
        self.next();
    },
    markAll: function (text, color) {
        var list = [];
        for (var i = 0; i < this.probes.length; i++) {
            list.push({ name: this.probes[i].name, status: text, color: color });
        }
        this.probes = list;
    },
    next: function () {
        var self = this;
        if (self.idx >= PROBES.length) {
            self.detail = '\u6d4b\u8bd5\u5b8c\u6210';
            return;
        }
        var i = self.idx;
        var p = PROBES[i];
        self.setStatus(i, '\u6d4b\u8bd5\u4e2d\u2026', '#ffc107');
        var done = false;
        var timer = setTimeout(function () {
            if (done) { return; }
            done = true;
            self.setStatus(i, '\u8d85\u65f6 6s', '#f44336');
            self.detail = p.name + ' \u65e0\u56de\u5e94\uff08\u770b\u95e8\u72d7\u8d85\u65f6\uff09';
            self.idx = i + 1;
            setTimeout(function () { self.next(); }, 50);
        }, WATCHDOG_MS);

        var finish = function (ok, text, color) {
            if (done) { return; }
            done = true;
            clearTimeout(timer);
            self.setStatus(i, text, color);
            self.idx = i + 1;
            setTimeout(function () { self.next(); }, 50);
        };

        try {
            self.fetchApi.fetch({
                url: p.url,
                method: 'GET',
                header: { 'Accept': 'application/json' },
                success: function (res) {
                    var code = res ? res.code : 0;
                    var raw = (res && res.data !== undefined && res.data !== null) ? String(res.data) : '';
                    if (p.key === 'lan') {
                        /* 目标探针：把拿到的内容亮出来，证明真取到了数据 */
                        var okBody = raw.indexOf('lanok') >= 0;
                        finish(true, okBody ? '\u2713 \u901a\uff0c\u53d6\u5230\u5185\u5bb9' : ('\u901a HTTP ' + code), '#4caf50');
                        self.detail = 'LAN \u54cd\u5e94(' + code + '): ' + raw.substring(0, 60);
                        return;
                    }
                    finish(true, '\u2713 \u901a HTTP ' + code, '#4caf50');
                    if (p.key === 'self') {
                        self.detail = '127.0.0.1 \u7adf\u7136\u901a\u4e86\uff1f\u54cd\u5e94: ' + raw.substring(0, 40);
                    }
                },
                fail: function (res, code) {
                    var c = (code === null || code === undefined) ? '' : String(code);
                    finish(false, '\u2717 \u5931\u8d25' + (c ? ' ' + c : ''), '#f44336');
                    self.detail = p.name + ' \u5931\u8d25\uff0c\u9519\u8bef\u7801 ' + (c || '\u7a7a');
                }
            });
        } catch (e) {
            finish(false, '\u2717 \u5f02\u5e38', '#f44336');
            self.detail = p.name + ' \u629b\u51fa\u5f02\u5e38: ' + String(e);
        }
    },
    setStatus: function (i, text, color) {
        var list = this.probes.slice();
        var item = { name: list[i].name, status: text, color: color };
        list[i] = item;
        this.probes = list;
    }
};
