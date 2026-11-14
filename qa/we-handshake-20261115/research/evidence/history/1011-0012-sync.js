import router from '../../common/router.js';
import data from '../../common/data.js';
import fs from '../../common/fs.js';

/* 课程表同步页 —— 从手机侧虚拟主机拉取 schedule.json 导入本地
 *
 * 云端：http://listenword.qingyun3.com/elcton/
 *   schedule.json  ← 手机网页编辑保存（save.php 落盘，rev 服务端单调递增）
 *   health.txt     ← 几字节探活，进页面自动打一次，用来分清「网络不通」和「数据有问题」
 *
 * 导入规则（docs/schedule-format.md §四）：
 *   1. schema 必须是 elcton.schedule；version 高于本端 → 拒绝导入（防读不懂的数据）
 *   2. 先比内容签名（id/名称/星期/节次/时间/周型），相同 → 已是最新，不动本地
 *   3. 签名不同：云端 rev > 本地 rev → 直接导入；否则视为「本地有改动」，
 *      第一次点给提示，再点一次才强制覆盖（不会静默吃掉本地改动）
 *   4. 导入走 data.replaceDoc → store.persist，本地 rev 自动 +1（规范要求每次落盘自增）
 *
 * 复用探测页的稳定模式：互斥 running + 代际 gen 丢弃过期回调 + 15s 看门狗
 * + 全部回调包 try（Lite 上任何抛进平台的异常都是闪退，v6 已踩过）。
 */
/* 两套端点：
 *   有取件码 → 多用户站 kebiao.qingyun3.com/api.php?action=get&pickup=xxxxxx（只读）
 *   没取件码 → 个人课表 listenword.../elcton/schedule.json（历史路线，保持可用）
 * 码存在 internal://app/sync.code.txt（6 字节，键盘页写入） */
var SITE = 'http://kebiao.qingyun3.com/';
var LEGACY = 'http://listenword.qingyun3.com/elcton/';
var CODE_URI = 'internal://app/sync.code.txt';
var SCHEDULE_URL = LEGACY + 'schedule.json';    /* 运行时按是否设码切换 */
var HEALTH_URL = SITE + 'health.txt';
var SCHEMA = 'elcton.schedule';
var VERSION = 1;
var WATCHDOG_MS = 15000;   /* 手机侧实测该主机 ~2.5s，留 15s 余量覆盖弱网 */

function brief(v, n) {
    if (v === undefined || v === null) { return ''; }
    var s;
    if (typeof v === 'object') {
        try { s = JSON.stringify(v); } catch (e) { s = null; }
        if (typeof s !== 'string') {
            try { s = String(v); } catch (e2) { s = '[unstringifiable]'; }
        }
    } else {
        s = String(v);
    }
    /* 无正则字面量（JerryScript profile）→ 手工压掉换行/制表 */
    var out = '';
    for (var i = 0; i < s.length; i++) {
        var cc = s.charCodeAt(i);
        out += (cc === 10 || cc === 13 || cc === 9) ? ' ' : s.charAt(i);
    }
    return out.length > n ? (out.substring(0, n) + '…') : out;
}

function str(v) { return (v === undefined || v === null) ? '' : String(v); }
function num(v, d) { var n = Number(v); return isNaN(n) ? d : n; }

/* 内容签名：与 rev/updatedAt 无关，只看课本身 → 判断「内容是否真的变了」
 * 不这么做的后果：replaceDoc 落盘会 rev+1，本地 rev 永远比云端大，
 * 下次拉取就会误判成「本地较新」而永远不再更新。 */
function sig(doc) {
    var list = doc.courses.slice().sort(function (a, b) {
        return str(a.id) < str(b.id) ? -1 : (str(a.id) > str(b.id) ? 1 : 0);
    });
    /* 数组 join 而非 s += 循环：60 课 O(n²) 拼接在 Lite 上是 CPU 峰值（卡死嫌疑之一）*/
    var parts = [];
    for (var i = 0; i < list.length; i++) {
        var c = list[i];
        parts.push(str(c.id) + '|' + str(c.name) + '|' + num(c.dayOfWeek, 0) + '|' +
                   num(c.startPeriod, 0) + '|' + num(c.endPeriod, 0) + '|' +
                   str(c.startTime) + '|' + str(c.endTime) + '|' + str(c.weekType) + ';');
    }
    return parts.join('');
}

/* 归一化：replaceDoc 直接把对象挂进缓存，字段缺失会让 serialize 出问题 → 先补齐 */
function normalize(remote) {
    var s = (remote.settings && typeof remote.settings === 'object') ? remote.settings : {};
    var out = {
        schema: SCHEMA,
        version: num(remote.version, VERSION),
        rev: num(remote.rev, 0),
        updatedAt: num(remote.updatedAt, 0),
        settings: {
            semesterStart: str(s.semesterStart) || '2026-09-01',
            currentWeek: num(s.currentWeek, 1),
            vibrationEnabled: s.vibrationEnabled === undefined ? true : !!s.vibrationEnabled,
            reminderMinutes: num(s.reminderMinutes, 5)
        },
        courses: []
    };
    var list = (remote.courses && remote.courses.length) ? remote.courses : [];
    for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (!c || typeof c !== 'object' || !c.id) { continue; }   /* 无 id 不入内存（规范 §二） */
        var weeks = [];
        if (c.weeks && c.weeks.length) {
            for (var k = 0; k < c.weeks.length; k++) { weeks.push(num(c.weeks[k], 0)); }
        }
        out.courses.push({
            id: str(c.id), name: str(c.name), location: str(c.location), teacher: str(c.teacher),
            dayOfWeek: num(c.dayOfWeek, 1), startPeriod: num(c.startPeriod, 1), endPeriod: num(c.endPeriod, 1),
            startTime: str(c.startTime), endTime: str(c.endTime),
            weekType: str(c.weekType) || 'all', weeks: weeks, colorIndex: num(c.colorIndex, 0)
        });
    }
    return out;
}

function mk(name, status, color) {
    return { name: name, status: status, color: color };
}

export default {
    data: {
        rows: [],
        detail: '',
        endpoint: 'kebiao.qingyun3.com'
    },
    onInit: function () {
        var self = this;
        self.dead = false;
        self.running = false;
        self.gen = 0;
        self.wdTimer = null;
        self.fetchApi = null;
        self.localRev = 0;
        self.localCount = 0;
        self.pendingForce = false;
        try { self.fetchApi = require('@system.fetch'); } catch (e) { self.fetchApi = null; }

        self.rows = [
            mk('本地课表', '读取中…', '#6c6c80'),
            mk('云端课表', '待拉取', '#6c6c80'),
            mk('取件码', '读取中…', '#6c6c80'),
            mk('连通自检', '待测', '#6c6c80')
        ];
        self.pickupCode = '';
        self.detail = '读取取件码中…';

        self.loadCode(function () {
            self.detail = '云端 ' + self.scheduleUrl();
            self.endpoint = (self.pickupCode.length === 6)
                ? 'kebiao.qingyun3.com（取件码）'
                : 'listenword.qingyun3.com/elcton（个人）';
            self.refreshLocal(function () {
                self.health();
            });
        });
    },
    onDestroy: function () {
        this.dead = true;
        this.gen++;
        try { clearTimeout(this.wdTimer); } catch (e) {}
        try { clearTimeout(this.reqTimer); } catch (e) {}
        try { clearTimeout(this.pageTimer); } catch (e) {}
        this.wdTimer = null;
        this.reqTimer = null;
        this.pageTimer = null;
    },
    onBack: function () {
        router.back();
    },
    /* 点行 = 上下文动作：自检行重跑自检、课表行刷新本地、其余只看详情 */
    onRowClick: function (idx) {
        var r = this.rows[idx];
        if (!r) { return; }
        if (idx === 2) { router.push({ uri: 'pages/code/code' }); return; }
        if (idx === 3) { this.detail = '重跑自检…'; this.health(); return; }
        if (idx === 0) { this.detail = '刷新本地…'; this.refreshLocal(function () {}); return; }
        this.detail = r.name + '：' + r.status;
    },
    setRow: function (i, status, color) {
        var list = this.rows.slice();
        if (!list[i]) { return; }
        list[i] = { name: list[i].name, status: status, color: color };
        this.rows = list;      /* 顶层赋值才触发刷新 */
    },
    /* ── 诊断事件环：关键状态打短标记；拉取行尾附最后标记，
     * 真机再卡死时截图一行状态即可定位死点（2026-10-10 卡死排查保险丝）── */
    pushTrace: function (tag) {
        if (!this.trace) { this.trace = []; }
        this.trace.push(tag);
        if (this.trace.length > 6) { this.trace.shift(); }
    },
    traceLast: function () {
        return (this.trace && this.trace.length) ? this.trace[this.trace.length - 1] : '';
    },
    traceStr: function () {
        return (this.trace && this.trace.length) ? this.trace.join(' ') : '';
    },
    /* 全程滑动看门狗：每页到手都重置；页间定时器失效 / fetch 不回调 /
     * 处理链冻结——任何一种 15s 后都显式报错，绝不无声卡死 */
    pokeWatchdog: function (gen) {
        var self = this;
        try { clearTimeout(self.wdTimer); } catch (e) {}
        self.wdTimer = setTimeout(function () {
            /* running=false = 链已停（报错/完成），遗留 timer 直接忽略，不许覆盖状态 */
            if (self.dead || gen !== self.gen || !self.running) { return; }
            self.running = false;
            self.pushTrace('TO');
            self.setRow(1, '✗ 停滞超时', '#f44336');
            self.detail = '看门狗超时 · 最后位置: ' + self.traceStr();
        }, self.watchdogMs || 15000);
    },
    /* 读取件码（键盘页写在 internal://app/sync.code.txt，6 字节） */
    loadCode: function (cb) {
        var self = this;
        var done = function (v) {
            self.pickupCode = v;
            if (v.length === 6) {
                self.setRow(2, '已设置 ' + v, '#4caf50');
            } else {
                self.setRow(2, '未设置 · 点这里填', '#ffc107');
            }
            if (cb) { cb(); }
        };
        try {
            fs.readFile(CODE_URI, function (err, text) {
                if (self.dead) { return; }
                var v = '';
                if (err === undefined || err === null) {
                    var t = String(text === undefined || text === null ? '' : text);
                    for (var i = 0; i < t.length; i++) {
                        var cc = t.charCodeAt(i);
                        if (cc >= 48 && cc <= 57 && v.length < 6) { v += t.charAt(i); }
                    }
                }
                done(v);
            });
        } catch (e) { done(''); }
    },
    scheduleUrl: function () {
        if (this.pickupCode && this.pickupCode.length === 6) {
            return SITE + 'api.php?action=get&pickup=' + this.pickupCode;
        }
        return LEGACY + 'schedule.json';
    },

    refreshLocal: function (cb) {
        var self = this;
        try {
            data.getDoc(function (doc) {
                if (!self.dead && doc) {
                    self.localRev = num(doc.rev, 0);
                    self.localCount = (doc.courses && doc.courses.length) ? doc.courses.length : 0;
                    self.setRow(0, 'rev ' + self.localRev + ' · ' + self.localCount + ' 门', '#7c86e0');
                }
                if (cb) { cb(); }
            });
        } catch (e) {
            self.setRow(0, '读取异常', '#f44336');
            if (cb) { cb(); }
        }
    },

    /* ── 通用 GET：看门狗 + 代际守卫 + 回调全包 try ── */
    httpGet: function (url, gen, cb) {
        var self = this;
        if (!self.fetchApi || !self.fetchApi.fetch) {
            cb(false, '@system.fetch 不可用', -100);
            return;
        }
        var done = false;
        var finish = function (ok, payload, code) {
            if (done || self.dead || gen !== self.gen) { return; }
            done = true;
            try { clearTimeout(self.reqTimer); } catch (e) {}
            /* cb 抛异常绝不能被外层 catch 吞：吞掉 = 链断 + 单请求看门狗已清 +
             * 无任何报错 = 无声冻结（2026-10-10 真机 4/6 卡死的放大器）→ 显式报出 */
            try { cb(ok, payload, code); }
            catch (e) {
                self.running = false;
                self.pushTrace('Ecb');
                self.setRow(1, '✗ 处理异常', '#f44336');
                self.detail = '回调异常 ' + brief(e, 50) + ' · ' + self.traceStr();
            }
        };
        try {
            self.reqTimer = setTimeout(function () {
                finish(false, '看门狗 ' + (WATCHDOG_MS / 1000) + 's 到点，无回调', -99);
            }, WATCHDOG_MS);
        } catch (e) {}
        try {
            self.fetchApi.fetch({
                url: url,
                method: 'GET',
                header: { 'Accept': 'application/json, text/plain' },
                success: function (res) {
                    try {
                        var body = (res && res.data !== undefined && res.data !== null) ? String(res.data) : '';
                        finish(true, body, res ? res.code : 0);
                    } catch (e) { finish(false, 'success 抛出 ' + brief(e, 40), -98); }
                },
                fail: function (res, code) {
                    try {
                        finish(false, brief(res, 70), (code === undefined || code === null) ? -97 : code);
                    } catch (e) { finish(false, 'fail 抛出 ' + brief(e, 40), -96); }
                }
            });
        } catch (e) {
            finish(false, '发起异常 ' + brief(e, 50), -95);
        }
    },

    /* ── 进页面自动打一次探活（几字节，最快，用来分清网络问题和数据问题） ── */
    health: function () {
        var self = this;
        if (self.running) { return; }
        if (!self.fetchApi) {
            self.setRow(3, 'fetch 模块不可用', '#f44336');
            self.detail = '@system.fetch 加载失败';
            return;
        }
        self.running = true;
        self.gen++;
        var gen = self.gen;
        self.setRow(3, '测试中…', '#ffc107');
        self.httpGet(HEALTH_URL, gen, function (ok, payload, code) {
            self.running = false;
            if (ok && String(payload).indexOf('ok') >= 0) {
                self.setRow(3, '✓ 通 ' + code, '#4caf50');
                self.detail = '自检 ' + brief(payload, 40);
            } else if (ok) {
                self.setRow(3, '✓ 通但内容异常', '#ffc107');
                self.detail = 'HTTP ' + code + ' body=' + brief(payload, 50);
            } else {
                self.setRow(3, '✗ ' + code, '#f44336');
                self.detail = '自检失败 code=' + brief(code, 8) + ' data=' + brief(payload, 60);
            }
        });
    },

    /* ── 拉取课表（切片版）：
     * 60 课整份 ≈12KB 一次给 Lite 会卡死（2026-10-10 真机事故）→ 服务端按
     * 20课/页 切片，这里逐页串行拉：页间 50ms 放行（Lite 回调可能同步派发，
     * 直接递归=变相并发=卡死）、页间 rev/updatedAt 一致性校验。
     * 服务端不支持 page 参数时忽略之并返回整份 → 无 slice 字段走老流程（降级）。 */
    onPull: function () {
        var self = this;
        if (self.running) {
            self.detail = '上一个请求还在跑，等它回来';
            return;
        }
        if (!self.fetchApi) {
            self.setRow(1, 'fetch 模块不可用', '#f44336');
            self.detail = '@system.fetch 加载失败';
            return;
        }
        self.running = true;
        self.gen++;
        var gen = self.gen;
        self.trace = [];
        /* 文本累积：每页 courses 序列化成字符串存放，页对象立即可回收。
         * 不再让 60 课对象树随页数渐进增长——几十 KB 的 JerryScript 堆上
         * 渐进到 40 课即逼近 OOM（两版切片都恰好卡在累计 40 课） */
        self.accText = [];
        self.accCount = 0;
        self.meta = null;
        self.pushTrace('go');
        self.pokeWatchdog(gen);
        self.pullPage(0, gen);
    },

    pullPage: function (n, gen) {
        var self = this;
        if (self.dead || gen !== self.gen) { return; }
        var base = self.scheduleUrl();
        var isPickup = !!(self.pickupCode && self.pickupCode.length === 6);
        var url = isPickup ? (base + '&page=' + n) : base;
        if (n === 0) { self.detail = 'GET ' + url; }
        self.pushTrace('p' + n + '>');
        self.setRow(1, (self.meta ? ('拉取第 ' + (n + 1) + '/' + self.meta.pages + ' 页…') : '拉取中…') +
                      ' ‹' + self.traceLast() + '›', '#ffc107');

        self.httpGet(url, gen, function (ok, payload, code) {
            if (self.dead || gen !== self.gen) { return; }
            if (!ok) {
                self.running = false;
                self.setRow(1, '✗ ' + code, '#f44336');
                self.detail = '拉取失败 code=' + brief(code, 8) + ' data=' + brief(payload, 60);
                return;
            }
            if (code >= 400) {
                self.running = false;
                self.setRow(1, '✗ HTTP ' + code, '#f44336');
                self.detail = '服务端返回 HTTP ' + code + ' body=' + brief(payload, 50);
                return;
            }
            var remote = null;
            try { remote = JSON.parse(payload); } catch (e) { remote = null; }
            if (!remote || typeof remote !== 'object') {
                self.running = false;
                self.setRow(1, '✗ 不是合法 JSON', '#f44336');
                self.detail = '解析失败 body=' + brief(payload, 60);
                return;
            }
            if (remote.slice === true) { self.gotSlice(remote, n, gen); return; }
            /* 整份响应（老服务端忽略 page / 无码 legacy 路线）→ 老流程 */
            self.finishDoc(remote, gen);
        });
    },

    /* 一页到手：校验 → 文本累积 → 串行下一页 / 收齐合并 */
    gotSlice: function (r, n, gen) {
        var self = this;
        if (self.dead || gen !== self.gen) { return; }
        self.pushTrace('p' + n + '<');
        self.pokeWatchdog(gen);
        if (r.schema !== SCHEMA) {
            self.running = false;
            self.setRow(1, '✗ schema 不匹配', '#f44336');
            self.detail = 'schema=' + brief(r.schema, 30) + '，不是课表文档，拒绝导入';
            return;
        }
        if (num(r.version, 0) > VERSION) {
            self.running = false;
            self.setRow(1, '✗ 云端格式更新', '#f44336');
            self.detail = '云端 version=' + r.version + ' > 本端 v' + VERSION + '，按规范禁止导入，请升级手表端';
            return;
        }
        if (n === 0) {
            self.meta = {
                schema: r.schema, version: num(r.version, 1),
                rev: num(r.rev, 0), updatedAt: num(r.updatedAt, 0),
                pages: num(r.pages, 1), settings: (r.settings && typeof r.settings === 'object') ? r.settings : {},
                total: num(r.total, 0)
            };
        } else if (!self.meta || num(r.rev, -1) !== self.meta.rev || num(r.updatedAt, -1) !== self.meta.updatedAt) {
            self.running = false;
            self.setRow(1, '✗ 云端中途变更', '#f44336');
            self.detail = '第 ' + (n + 1) + ' 页 rev/updatedAt 与首页不一致（网页可能刚保存过），再点一次「拉取」重来';
            return;
        }
        if (num(r.pages, 1) !== self.meta.pages) {
            self.running = false;
            self.setRow(1, '✗ 页数不一致', '#f44336');
            self.detail = '首页 pages=' + self.meta.pages + '，第 ' + (n + 1) + ' 页 pages=' + r.pages;
            return;
        }
        var list = (r.courses && r.courses.length) ? r.courses : [];
        /* 文本累积：本页序列化成字符串后即丢，页对象可回收——对象树渐进到
         * 40 课就在几十 KB 的 JerryScript 堆上逼近 OOM（两版都恰好卡在 40 课）。
         * 段格式='{..},{..}'（无外层数组括号）→ 合并时统一包一层，防双重嵌套 */
        if (list.length) {
            var parts = [];
            for (var i = 0; i < list.length; i++) { parts.push(JSON.stringify(list[i])); }
            self.accText.push(parts.join(','));
            self.accCount += list.length;
        }
        self.setRow(1, '拉取 ' + (n + 1) + '/' + self.meta.pages + ' 页 · ' + self.accCount + ' 课' +
                      ' ‹' + self.traceLast() + '›', '#ffc107');
        self.detail = '切片进度 ' + (n + 1) + '/' + self.meta.pages + '（' + self.accCount + '/' + self.meta.total + ' 课）';
        if ((n + 1) < self.meta.pages) {
            /* 页间 400ms 放行：Lite 回调可能同步派发（直接递归=变相并发=卡死），
             * 且每页后给网络栈/事件循环喘息——回调内再包 try，异常显式报出 */
            self.pushTrace('w');
            try {
                self.pageTimer = setTimeout(function () {
                    if (self.dead || gen !== self.gen) { return; }
                    try { self.pullPage(n + 1, gen); }
                    catch (e) {
                        self.running = false;
                        self.pushTrace('Epg');
                        self.setRow(1, '✗ 分页异常', '#f44336');
                        self.detail = 'pullPage 抛出 ' + brief(e, 50) + ' · ' + self.traceStr();
                    }
                }, 400);
            } catch (e) {
                self.running = false;
                self.setRow(1, '✗ 定时器失败', '#f44336');
                self.detail = '页间定时器创建失败 ' + brief(e, 40);
            }
            return;
        }
        /* 收齐 → 最重的整份处理（合并/normalize/比对/落盘）延后 100ms 单独一拍，
         * 不与最后一次 fetch 回调挤在同一个事件循环里；整段包 try 显式报错 */
        self.pushTrace('mg');
        setTimeout(function () {
            if (self.dead || gen !== self.gen) { return; }
            try {
                /* 逐段解析而非一次性 join 大串：源串+对象树会双份占堆（64/256KB），
                 * 分段后峰值 = 已累积对象 + 1.8KB 段文本；每段解析完立即置空释放 */
                var courses = [];
                var k, j;
                for (k = 0; k < self.accText.length; k++) {
                    var segCourses = null;
                    segCourses = JSON.parse('[' + self.accText[k] + ']');
                    for (j = 0; j < segCourses.length; j++) { courses.push(segCourses[j]); }
                    self.accText[k] = '';
                }
                self.accText = [];
                var full = {
                    schema: self.meta.schema, version: self.meta.version,
                    rev: self.meta.rev, updatedAt: self.meta.updatedAt,
                    settings: self.meta.settings, courses: courses
                };
                var normalized = null;
                var normErr = null;
                try { normalized = normalize(full); } catch (e) { normalized = null; normErr = e; }
                if (!normalized) {
                    self.running = false;
                    self.setRow(1, '✗ 归一化失败', '#f44336');
                    self.detail = '合并 ' + courses.length + ' 课 normalize 抛出 ' + brief(normErr, 50);
                    return;
                }
                self.decide(normalized, gen);
            } catch (e2) {
                self.running = false;
                self.pushTrace('Emg');
                self.setRow(1, '✗ 合并异常', '#f44336');
                self.detail = '合并抛出 ' + brief(e2, 50) + ' · ' + self.traceStr();
            }
        }, 100);
    },

    /* 整份响应处理（老流程）：兼容包装 → schema/version 校验 → decide */
    finishDoc: function (remote, gen) {
        var self = this;
        self.pushTrace('doc');
        if (!remote.schema && remote.doc && typeof remote.doc === 'object') {
            remote = remote.doc;
        }
        if (remote.schema !== SCHEMA) {
            self.running = false;
            self.setRow(1, '✗ schema 不匹配', '#f44336');
            self.detail = 'schema=' + brief(remote.schema, 30) + '，不是课表文档，拒绝导入';
            return;
        }
        if (num(remote.version, 0) > VERSION) {
            self.running = false;
            self.setRow(1, '✗ 云端格式更新', '#f44336');
            self.detail = '云端 version=' + remote.version + ' > 本端 v' + VERSION +
                          '，按规范禁止导入，请升级手表端';
            return;
        }
        var normalized = null;
        var normErr = null;
        try { normalized = normalize(remote); } catch (e2) { normalized = null; normErr = e2; }
        if (!normalized) {
            self.running = false;
            self.setRow(1, '✗ 归一化失败', '#f44336');
            self.detail = 'normalize 抛出 ' + brief(normErr, 50);
            return;
        }
        self.decide(normalized, gen);
    },

    decide: function (remote, gen) {
        var self = this;
        self.pushTrace('dec');
        try {
            data.getDoc(function (local) {
                if (self.dead || gen !== self.gen) { return; }
                if (!local) {
                    self.running = false;
                    self.setRow(1, '✗ 本地读取失败', '#f44336');
                    self.detail = 'getDoc 返回空，先看本地课表是否损坏';
                    return;
                }
                var same = false;
                try {
                    /* 长度短路：课数不同必不等 → 跳过两次 sig 构造
                     * （60 课 sig≈4KB ×2，几十 KB 堆上是可观的瞬时峰值） */
                    var lc = (local.courses && local.courses.length) ? local.courses.length : 0;
                    if (lc === remote.courses.length) { same = (sig(local) === sig(remote)); }
                } catch (e) { same = false; }

                if (same) {
                    self.running = false;
                    self.pendingForce = false;
                    self.setRow(1, '✓ 已是最新 rev ' + remote.rev, '#4caf50');
                    self.detail = '内容与本地完全一致（' + remote.courses.length + ' 门），无需导入';
                    return;
                }
                var localRev = num(local.rev, 0);
                if (remote.rev <= localRev && !self.pendingForce) {
                    self.running = false;
                    self.pendingForce = true;
                    self.setRow(1, '本地有改动', '#ffc107');
                    self.detail = '本地 rev ' + localRev + ' ≥ 云端 rev ' + remote.rev +
                                  ' 且内容不同。再点一次「拉取」= 强制用云端覆盖本地';
                    return;
                }
                self.apply(remote, gen);
            });
        } catch (e) {
            self.running = false;
            self.setRow(1, '✗ 异常', '#f44336');
            self.detail = '比对阶段抛出 ' + brief(e, 60);
        }
    },

    apply: function (remote, gen) {
        var self = this;
        self.pushTrace('app');
        try {
            data.replaceDoc(remote, function (ok) {
                if (self.dead || gen !== self.gen) { return; }
                self.running = false;
                if (ok) {
                    self.pendingForce = false;
                    self.pushTrace('ok');
                    self.setRow(1, '✓ 已导入 rev ' + remote.rev, '#4caf50');
                    self.detail = '导入 ' + remote.courses.length + ' 门课；落盘后本地 rev 自增（规范 §四.3）';
                    self.refreshLocal(function () { self.setRow(1, '✓ 已导入 · 本地 rev ' + self.localRev, '#4caf50'); });
                } else {
                    self.setRow(1, '✗ 落盘失败', '#f44336');
                    self.detail = 'replaceDoc 回调 false：文件写入失败（空间不足或文件被占用）';
                }
            });
        } catch (e) {
            self.running = false;
            self.pushTrace('Eap');
            self.setRow(1, '✗ 异常', '#f44336');
            self.detail = '导入阶段抛出 ' + brief(e, 60) + ' · ' + self.traceStr();
        }
    },

    onRetry: function () {
        var self = this;
        self.pendingForce = false;
        self.gen++;                 /* 丢弃在途回调，重新开始 */
        try { clearTimeout(self.wdTimer); } catch (e) {}
        try { clearTimeout(self.reqTimer); } catch (e) {}
        try { clearTimeout(self.pageTimer); } catch (e) {}
        self.running = false;
        self.trace = [];
        self.setRow(1, '待拉取', '#6c6c80');
        self.setRow(3, '待测', '#6c6c80');
        self.refreshLocal(function () { self.health(); });
    }
};
