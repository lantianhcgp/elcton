import router from '../../common/router.js';

/* LAN 可达性探测（课程表同步功能的前置实测）
 * 候选顺序：手机 Wi-Fi 内网（目标）→ 手表本机（对照，预期失败）→ 公网 HTTP → 公网 HTTPS
 * 串行 + 每条 6s 看门狗：lite 真机并发 fetch 会卡死、回调可能不回来（参照签到 app 实测经验）
 */
var PROBES = [
    { name: '手机内网 :8123', url: 'http://192.168.1.200:8123/t.json', key: 'lan' },
    { name: '表本机 127.0.0.1', url: 'http://127.0.0.1:8123/t.json', key: 'self' },
    { name: '公网 HTTP', url: 'http://connect.rom.miui.com/generate_204', key: 'net' },
    { name: '公网 HTTPS', url: 'https://ws.fseatech.cn/', key: 'https' }
];
var WATCHDOG_MS = 6000;

export default {
    data: {
        probes: [],
        detail: ''
    },
    onInit: function () {
        this.dead = false;
        this.wdTimer = null;
        this.chainTimer = null;
        this.reset();
        this.runAll();
    },
    onDestroy: function () {
        /* 定时器必须清：lite 上不清会持续泄漏，几次进退页面就卡死 */
        this.dead = true;
        try { clearTimeout(this.wdTimer); } catch (e) {}
        try { clearTimeout(this.chainTimer); } catch (e) {}
        this.wdTimer = null;
        this.chainTimer = null;
    },
    reset: function () {
        var list = [];
        for (var i = 0; i < PROBES.length; i++) {
            list.push({ name: PROBES[i].name, status: '待测', color: '#6c6c80' });
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
            self.markAll('联网模块不可用', '#f44336');
            self.detail = '@system.fetch 加载失败（未声明权限或运行时不支持）';
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
        if (self.dead) { return; }
        if (self.idx >= PROBES.length) {
            self.detail = '测试完成';
            return;
        }
        var i = self.idx;
        var p = PROBES[i];
        self.setStatus(i, '测试中…', '#ffc107');
        var done = false;
        try {
            self.wdTimer = setTimeout(function () {
                if (done || self.dead) { return; }
                done = true;
                self.setStatus(i, '超时 6s', '#f44336');
                self.detail = p.name + ' 无回应（看门狗超时）';
                self.idx = i + 1;
                self.chainTimer = setTimeout(function () { self.next(); }, 50);
            }, WATCHDOG_MS);
        } catch (e) {}

        var finish = function (ok, text, color) {
            if (done || self.dead) { return; }
            done = true;
            try { clearTimeout(self.wdTimer); } catch (e) {}
            self.setStatus(i, text, color);
            self.idx = i + 1;
            self.chainTimer = setTimeout(function () { self.next(); }, 50);
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
                        /* 目标探针：把内容亮出来，证明真取到了数据 */
                        if (raw.indexOf('lanok') >= 0) {
                            finish(true, '✓ 通，有内容', '#4caf50');
                        } else {
                            finish(true, '✓ 通 HTTP ' + code, '#4caf50');
                        }
                        if (!self.dead) {
                            self.detail = 'LAN 响应(' + code + '): ' + raw.substring(0, 60);
                        }
                        return;
                    }
                    finish(true, '✓ 通 HTTP ' + code, '#4caf50');
                    if (p.key === 'self' && !self.dead) {
                        self.detail = '127.0.0.1 竟然通了？响应: ' + raw.substring(0, 40);
                    }
                },
                fail: function (res, code) {
                    var c = (code === null || code === undefined) ? '' : String(code);
                    finish(false, '✗ 失败' + (c ? ' ' + c : ''), '#f44336');
                    if (!self.dead) {
                        self.detail = p.name + ' 失败，错误码 ' + (c || '空');
                    }
                }
            });
        } catch (e) {
            finish(false, '✗ 异常', '#f44336');
            if (!self.dead) {
                self.detail = p.name + ' 抛出异常: ' + String(e);
            }
        }
    },
    setStatus: function (i, text, color) {
        var list = this.probes.slice();
        list[i] = { name: list[i].name, status: text, color: color };
        this.probes = list;
    }
};
