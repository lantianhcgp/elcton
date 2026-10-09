import router from '../../common/router.js';

/* LAN 可达性探测（课程表同步功能的前置实测）
 * 7 条：3 个手机侧候选地址 + 表本机对照 + 公网HTTP(带body) + 公网HTTPS + 签到服HTTPS
 * 串行 + 每条 6s 看门狗：lite 真机并发 fetch 会卡死、回调可能不回来（签到 app 实测经验）
 *
 * v3（第二轮真机结果驱动）：
 * - v2 的详情被结束语「测试完成」顶掉，且「点行看详情」根本没实现 → 每行结果独立存
 *   details[]，行可点，点了才显示该行的完整证据
 * - 加耗时：分清「秒拒（路由/协议层）」和「挂住（链路层）」——第一轮 4 本地全是秒拒，
 *   公网 HTTP 是挂到看门狗，这两种失败的排查方向完全不同
 * - fail 的原始 data 仍全程带出（-6/-9 无公开码表，只能拿证据）
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
        details: [],
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
        var det = [];
        for (var i = 0; i < PROBES.length; i++) {
            list.push({ name: PROBES[i].name, status: '待测', color: '#6c6c80' });
            det.push('—');
        }
        this.probes = list;
        this.details = det;
        this.detail = '';
    },
    onRun: function () {
        this.reset();
        this.runAll();
    },
    onBack: function () {
        router.back();
    },
    /* 点某一行 → 底部显示该行的完整证据（fail 的 code + 原始 data + 耗时） */
    onRowClick: function (idx) {
        var d = this.details[idx];
        if (d && d !== '—') { this.detail = d; }
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
            self.detail = '全部完成：点任意一行看该条的原始证据';
            return;
        }
        var i = self.idx;
        var p = PROBES[i];
        var t0 = new Date().getTime();
        self.setStatus(i, '测试中…', '#ffc107');
        var done = false;

        /* 结果与证据都在这里落：晚到的回调一律不再改（v2 之前的覆盖 bug） */
        var finish = function (text, color, evidence) {
            if (done || self.dead) { return; }
            done = true;
            try { clearTimeout(self.wdTimer); } catch (e) {}
            var ms = new Date().getTime() - t0;
            self.setStatus(i, text, color);
            var det = self.details.slice();
            det[i] = p.name + ' | ' + (ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(1) + 's') + ' | ' + evidence;
            self.details = det;
            self.detail = det[i];
            self.idx = i + 1;
            self.chainTimer = setTimeout(function () { self.next(); }, 50);
        };

        try {
            self.wdTimer = setTimeout(function () {
                finish('超时 6s', '#f44336',
                    '看门狗到点，无任何回调（请求挂在链路上）');
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
                                'HTTP ' + code + ' 拿到 lanok；服务端日志里的来源 IP = 手表真实子网');
                        } else {
                            finish('✓ 通 HTTP ' + code, '#4caf50',
                                'HTTP ' + code + ' body=' + brief(raw, 36));
                        }
                        return;
                    }
                    finish('✓ 通 HTTP ' + code, '#4caf50',
                        'HTTP ' + code + ' body=' + brief(raw, 36) +
                        (raw.length > 36 ? ' (' + raw.length + 'B)' : ''));
                },
                fail: function (res, code) {
                    /* -6/-9/204 无公开码表 → 必须带原始 data 才能对号 */
                    finish('✗ ' + (code === undefined || code === null ? '失败' : code), '#f44336',
                        'fail code=' + brief(code, 8) + ' data=' + brief(res, 60));
                }
            });
        } catch (e) {
            finish('✗ 异常', '#f44336', '抛异常: ' + brief(e, 60));
        }
    },
    setStatus: function (i, text, color) {
        var list = this.probes.slice();
        list[i] = { name: list[i].name, status: text, color: color };
        this.probes = list;
    }
};
