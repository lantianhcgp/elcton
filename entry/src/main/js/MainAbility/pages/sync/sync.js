import router from '../../common/router.js';

/* LAN 可达性探测（课程表同步功能的前置实测）—— v6
 *
 * 第四轮真机结果（用户多轮重测）已确认三件事：
 *   1) 公网可达：签到服 HTTPS → 200、百度 HTTPS → 200（间歇）、
 *      223.5.5.5 → 404（404 是真实 HTTP 响应 = 纯 IP 直连也通，DNS 不是凶手）。
 *      此前那轮 -6/-9/超时，归因手机侧代理/VPN（当时挂着 tun0 fake-IP 隧道）。
 *   2) 127.0.0.1 永远 -6：表的回环指的是表自己，不是手机 —— 这是设计内的阴性对照。
 *   3) 内网探针 192.168.1.200 是过期地址（手机 Wi-Fi 网络已换成 192.168.45.224），
 *      过期地址必然 -6。本轮换成 192.168.45.224，给内网路线最后一次机会。
 *
 * v6 修崩溃（用户报「重测时应用闪退」）：
 *   A. onRun 无互斥 → 上一轮未结束时再点会开第二条链，两链并发 fetch、老回调回写 idx 乱套。
 *      Lite 平台并发 fetch 已知会挂起/崩溃。修法：running 互斥 + 代际 gen 守卫，
 *      任何过期回调（gen 不匹配）一律 no-op，且链尾/销毁都推进代际。
 *   B. brief() 中 JSON.stringify 可能返回 undefined（function/symbol 值），
 *      紧接着 .length 即 TypeError；而 success/fail 回调体原本没包 try ——
 *      异常抛进平台回调会直接闪退。修法：brief 结果兜底 + finish 全体 try/catch。
 */
var PROBES = [
    { name: '公网IP 223.5.5.5', url: 'http://223.5.5.5/', key: 'ip' },
    { name: '域名 HTTP qq', url: 'http://www.qq.com/', key: 'http' },
    { name: '域名 HTTPS 百度', url: 'https://www.baidu.com/', key: 'https' },
    { name: '签到服 HTTPS', url: 'https://ws.fseatech.cn/', key: 'relay' },
    { name: '手机Wi-Fi 45.224', url: 'http://192.168.45.224:8123/t.json', key: 'lan' },
    { name: '表本机 127.0.0.1', url: 'http://127.0.0.1:8123/t.json', key: 'self' }
];
var WATCHDOG_MS = 10000;   /* 第三轮放宽后公网拿到过响应，保持 10s */

function brief(v, n) {
    if (v === undefined || v === null) { return ''; }
    var s;
    if (typeof v === 'object') {
        try { s = JSON.stringify(v); } catch (e) { s = null; }
        if (typeof s !== 'string') {   /* 循环引用 → null；function → undefined：都兜底 */
            try { s = String(v); } catch (e2) { s = '[unstringifiable]'; }
        }
    } else {
        s = String(v);
    }
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
        this.running = false;   /* 互斥：一轮未结束禁止重入 */
        this.gen = 0;           /* 代际：过期回调一律丢弃 */
        this.wdTimer = null;
        this.chainTimer = null;
        this.reset();
        this.runAll();
    },
    onDestroy: function () {
        this.dead = true;
        this.gen++;             /* 让所有在途回调失效 */
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
        if (this.running) {                 /* 互斥：杜绝双链并发 fetch */
            this.detail = '上一轮还没跑完，跑完再重测';
            return;
        }
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
        self.running = true;
        self.idx = 0;
        self.gen++;
        self.fetchApi = f;
        self.next(self.gen);
    },
    markAll: function (text, color) {
        var list = [];
        for (var i = 0; i < this.probes.length; i++) {
            list.push({ name: this.probes[i].name, status: text, color: color });
        }
        this.probes = list;
    },
    next: function (gen) {
        var self = this;
        if (self.dead || gen !== self.gen) { return; }
        if (self.idx >= PROBES.length) {
            self.running = false;
            self.detail = '全部完成：点任意一行看该条原始证据';
            return;
        }
        var i = self.idx;
        var p = PROBES[i];
        var t0 = new Date().getTime();
        self.setStatus(i, '测试中…', '#ffc107');
        var done = false;

        var finish = function (text, color, evidence) {
            if (done || self.dead || gen !== self.gen) { return; }
            done = true;
            try { clearTimeout(self.wdTimer); } catch (e) {}
            try {
                var ms = new Date().getTime() - t0;
                self.setStatus(i, text, color);
                var det = self.details.slice();
                det[i] = p.name + ' | ' + (ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(1) + 's') + ' | ' + evidence;
                self.details = det;
                self.detail = det[i];
                self.idx = i + 1;
                self.chainTimer = setTimeout(function () { self.next(gen); }, 50);
            } catch (e) {
                /* 回调体内部任何异常都不得抛进平台代码（会闪退） */
                self.running = false;
            }
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
                    try {
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
                    } catch (e) { finish('✗ 回调异常', '#f44336', 'success 回调抛出: ' + brief(e, 60)); }
                },
                fail: function (res, code) {
                    try {
                        finish('✗ ' + (code === undefined || code === null ? '失败' : code), '#f44336',
                            'fail code=' + brief(code, 8) + ' data=' + brief(res, 60));
                    } catch (e) { finish('✗ 回调异常', '#f44336', 'fail 回调抛出: ' + brief(e, 60)); }
                }
            });
        } catch (e) {
            finish('✗ 异常', '#f44336', '抛异常: ' + brief(e, 60));
        }
    },
    setStatus: function (i, text, color) {
        var list = this.probes.slice();
        if (!list[i]) { return; }   /* 保护：避免越界读 name 二次崩溃 */
        list[i] = { name: list[i].name, status: text, color: color };
        this.probes = list;
    }
};
