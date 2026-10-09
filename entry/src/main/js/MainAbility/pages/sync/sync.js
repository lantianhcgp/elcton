import router from '../../common/router.js';

/* LAN 可达性探测（课程表同步功能的前置实测）
 *
 * v4（第三轮真机结果驱动）——本轮目标是**一次性分清三种病因**：
 *   A. 只有 DNS 坏  → IP 探针通、域名探针挂/拒
 *   B. 整条路由都没有 → 全部 -6/-9，连 IP 探针也不通（论坛同款：fetch 不走蓝牙借网）
 *   C. 路由有、只是慢 → IP/域名都通，只是超过 6s（v4 看门狗放宽到 10s）
 * 本地候选砍到 2 个：真实地址 192.168.1.200（需手机开 Wi-Fi）+ 表本机对照，
 * 另外 44.1/49.1 是猜的网段，实测全 -6，没有信息量。
 */
var PROBES = [
    { name: '公网IP 223.5.5.5', url: 'http://223.5.5.5/', key: 'ip' },
    { name: '域名 HTTP qq', url: 'http://www.qq.com/', key: 'http' },
    { name: '域名 HTTPS 百度', url: 'https://www.baidu.com/', key: 'https' },
    { name: '签到服 HTTPS', url: 'https://ws.fseatech.cn/', key: 'relay' },
    { name: '手机Wi-Fi 1.200', url: 'http://192.168.1.200:8123/t.json', key: 'lan' },
    { name: '表本机 127.0.0.1', url: 'http://127.0.0.1:8123/t.json', key: 'self' }
];
var WATCHDOG_MS = 10000;   /* v3 是 6s：第一轮公网 HTTP 拿到过 204 但 >6s，放宽再看 */

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
            self.detail = '全部完成：点任意一行看该条原始证据';
            return;
        }
        var i = self.idx;
        var p = PROBES[i];
        var t0 = new Date().getTime();
        self.setStatus(i, '测试中…', '#ffc107');
        var done = false;

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
                finish('超时10s', '#f44336', '看门狗到点，无任何回调（请求挂在链路上）');
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
                                'HTTP ' + code + ' 拿到 lanok；服务端日志来源 IP = 手表真实子网');
                        } else {
                            finish('✓ 通 HTTP ' + code, '#4caf50', 'HTTP ' + code + ' body=' + brief(raw, 36));
                        }
                        return;
                    }
                    finish('✓ 通 HTTP ' + code, '#4caf50',
                        'HTTP ' + code + ' body=' + brief(raw, 36) +
                        (raw.length > 36 ? ' (' + raw.length + 'B)' : ''));
                },
                fail: function (res, code) {
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
