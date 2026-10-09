import router from '../../common/router.js';

/* LAN 可达性探测（课程表同步功能的前置实测）
 * 7 条：3 个手机侧候选地址 + 表本机对照 + 公网HTTP(带body) + 公网HTTPS + 签到服HTTPS
 * 串行 + 每条 6s 看门狗：lite 真机并发 fetch 会卡死、回调可能不回来（签到 app 实测经验）
 *
 * v2（2026-10-09 首轮真机结果驱动）：
 * - 首轮 4 个本地地址全 -6、公网HTTP 超时后 fail(204)、HTTPS -9，且 -6/-9 无公开码表
 *   → 失败时把 fail 的 **原始 data** 一并打出来，用证据代替猜码
 * - 晚到的回调会覆盖详情（首轮「超时6s」被后来的204顶掉）→ 详情统一在 finish 里写
 * - 行高压到 32px 塞下 7 条（按钮底 383 ≤410，仍让开圆角危险区）
 */
var PROBES = [
    { name: 'Wi-Fi 1.200:8123', url: 'http://192.168.1.200:8123/t.json', key: 'lan' },
    { name: 'BLE网关 44.1', url: 'http://192.168.44.1:8123/t.json', key: 'lan' },
    { name: '热点网关 49.1', url: 'http://192.168.49.1:8123/t.json', key: 'lan' },
    { name: '表本机 127.0.0.1', url: 'http://127.0.0.1:8123/t.json', key: 'self' },
    { name: '公网HTTP qq', url: 'http://www.qq.com/', key: 'http' },
    { name: '公网HTTPS 百度', url: 'https://www.baidu.com/', key: 'https' },
    { name: '签到服 HTTPS', url: 'https://ws.fseatech.cn/', key: 'relay' }
];
var WATCHDOG_MS = 6000;

function brief(v, n) {
    if (v === undefined || v === null) { return ''; }
    var s = (typeof v === 'object') ? JSON.stringify(v) : String(v);
    /* 不能用正则字面量（JerryScript 构建 profile 关掉）→ 手工压掉换行/制表 */
    var out = '';
    for (var i = 0; i < s.length; i++) {
        var cc = s.charCodeAt(i);
        out += (cc === 10 || cc === 13 || cc === 9) ? ' ' : s.charAt(i);
    }
    return out.length > n ? (out.substring(0, n) + '…') : out;
}

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
            self.detail = '测试完成（点行看详情，点重测再跑）';
            return;
        }
        var i = self.idx;
        var p = PROBES[i];
        self.setStatus(i, '测试中…', '#ffc107');
        var done = false;

        /* 详情一律在这里写：晚到的回调不再覆盖已完成的结论 */
        var finish = function (text, color, detailText) {
            if (done || self.dead) { return false; }
            done = true;
            try { clearTimeout(self.wdTimer); } catch (e) {}
            self.setStatus(i, text, color);
            self.detail = detailText || '';
            self.idx = i + 1;
            self.chainTimer = setTimeout(function () { self.next(); }, 50);
            return true;
        };

        try {
            self.wdTimer = setTimeout(function () {
                finish('超时 6s', '#f44336',
                    p.name + ' 六秒无回应（有响应码也没回来）');
            }, WATCHDOG_MS);
        } catch (e) {}

        try {
            self.fetchApi.fetch({
                url: p.url,
                method: 'GET',
                header: { 'Accept': 'application/json, text/plain' },
                success: function (res) {
                    var code = res ? res.code : 0;
                    var raw = (res && res.data !== undefined && res.data !== null) ? String(res.data) : '';
                    if (p.key === 'lan') {
                        if (raw.indexOf('lanok') >= 0) {
                            finish('✓ 通，有内容', '#4caf50',
                                p.name + ' 拿到 lanok（HTTP ' + code + '），来源即手表子网');
                        } else {
                            finish('✓ 通 HTTP ' + code, '#4caf50',
                                p.name + ' 响应 ' + brief(raw, 40));
                        }
                        return;
                    }
                    finish('✓ 通 HTTP ' + code, '#4caf50',
                        p.name + ' 返回 ' + brief(raw, 40) + (raw.length > 40 ? ' (' + raw.length + 'B)' : ''));
                },
                fail: function (res, code) {
                    /* code 语义无公开码表（首轮 -6/-9/204 无法对号入座）→ 把 data 原样带出 */
                    finish('✗ ' + (code === undefined || code === null ? '失败' : code), '#f44336',
                        p.name + ' fail code=' + brief(code, 8) + ' data=' + brief(res, 44));
                }
            });
        } catch (e) {
            finish('✗ 异常', '#f44336', p.name + ' 抛异常: ' + brief(e, 44));
        }
    },
    setStatus: function (i, text, color) {
        var list = this.probes.slice();
        list[i] = { name: list[i].name, status: text, color: color };
        this.probes = list;
    }
};
