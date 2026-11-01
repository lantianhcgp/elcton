import router from '../../common/router.js';
import data from '../../common/data.js';
import fs from '../../common/fs.js';

import protocol from '../../common/wearProtocol.js';

/* \u8bfe\u7a0b\u8868\u540c\u6b65\u9875 \u2014\u2014 \u4ece\u624b\u673a\u4fa7\u865a\u62df\u4e3b\u673a\u62c9\u53d6 schedule.json \u5bfc\u5165\u672c\u5730
 *
 * \u4e91\u7aef\uff1ahttp://listenword.qingyun3.com/elcton/
 *   schedule.json  \u2190 \u624b\u673a\u7f51\u9875\u7f16\u8f91\u4fdd\u5b58\uff08save.php \u843d\u76d8\uff0crev \u670d\u52a1\u7aef\u5355\u8c03\u9012\u589e\uff09
 *   health.txt     \u2190 \u51e0\u5b57\u8282\u63a2\u6d3b\uff0c\u8fdb\u9875\u9762\u81ea\u52a8\u6253\u4e00\u6b21\uff0c\u7528\u6765\u5206\u6e05\u300c\u7f51\u7edc\u4e0d\u901a\u300d\u548c\u300c\u6570\u636e\u6709\u95ee\u9898\u300d
 *
 * \u5bfc\u5165\u89c4\u5219\uff08docs/schedule-format.md \u00a7\u56db\uff09\uff1a
 *   1. schema \u5fc5\u987b\u662f elcton.schedule\uff1bversion \u9ad8\u4e8e\u672c\u7aef \u2192 \u62d2\u7edd\u5bfc\u5165\uff08\u9632\u8bfb\u4e0d\u61c2\u7684\u6570\u636e\uff09
 *   2. \u5148\u6bd4\u5185\u5bb9\u7b7e\u540d\uff08id/\u540d\u79f0/\u661f\u671f/\u8282\u6b21/\u65f6\u95f4/\u5468\u578b\uff09\uff0c\u76f8\u540c \u2192 \u5df2\u662f\u6700\u65b0\uff0c\u4e0d\u52a8\u672c\u5730
 *   3. \u7b7e\u540d\u4e0d\u540c\uff1a\u4e91\u7aef rev > \u672c\u5730 rev \u2192 \u76f4\u63a5\u5bfc\u5165\uff1b\u5426\u5219\u89c6\u4e3a\u300c\u672c\u5730\u6709\u6539\u52a8\u300d\uff0c
 *      \u7b2c\u4e00\u6b21\u70b9\u7ed9\u63d0\u793a\uff0c\u518d\u70b9\u4e00\u6b21\u624d\u5f3a\u5236\u8986\u76d6\uff08\u4e0d\u4f1a\u9759\u9ed8\u5403\u6389\u672c\u5730\u6539\u52a8\uff09
 *   4. \u5bfc\u5165\u8d70 data.replaceDoc \u2192 store.persist\uff0c\u672c\u5730 rev \u81ea\u52a8 +1\uff08\u89c4\u8303\u8981\u6c42\u6bcf\u6b21\u843d\u76d8\u81ea\u589e\uff09
 *
 * \u590d\u7528\u63a2\u6d4b\u9875\u7684\u7a33\u5b9a\u6a21\u5f0f\uff1a\u4e92\u65a5 running + \u4ee3\u9645 gen \u4e22\u5f03\u8fc7\u671f\u56de\u8c03 + 15s \u770b\u95e8\u72d7
 * + \u5168\u90e8\u56de\u8c03\u5305 try\uff08Lite \u4e0a\u4efb\u4f55\u629b\u8fdb\u5e73\u53f0\u7684\u5f02\u5e38\u90fd\u662f\u95ea\u9000\uff0cv6 \u5df2\u8e29\u8fc7\uff09\u3002
 */
/* \u4e24\u5957\u7aef\u70b9\uff1a
 *   \u6709\u53d6\u4ef6\u7801 \u2192 \u591a\u7528\u6237\u7ad9 kebiao.qingyun3.com/api.php?action=get&pickup=xxxxxx\uff08\u53ea\u8bfb\uff09
 *   \u6ca1\u53d6\u4ef6\u7801 \u2192 \u4e2a\u4eba\u8bfe\u8868 listenword.../elcton/schedule.json\uff08\u5386\u53f2\u8def\u7ebf\uff0c\u4fdd\u6301\u53ef\u7528\uff09
 * \u7801\u5b58\u5728 internal://app/sync.code.txt\uff086 \u5b57\u8282\uff0c\u952e\u76d8\u9875\u5199\u5165\uff09 */
var SITE = 'http://kebiao.qingyun3.com/';
var LEGACY = 'http://listenword.qingyun3.com/elcton/';
var CODE_URI = 'internal://app/sync.code.txt';
var SCHEDULE_URL = LEGACY + 'schedule.json';    /* \u8fd0\u884c\u65f6\u6309\u662f\u5426\u8bbe\u7801\u5207\u6362 */
var HEALTH_URL = SITE + 'health.txt';
var SCHEMA = 'elcton.schedule';
var VERSION = 1;
var WATCHDOG_MS = 15000;   /* \u624b\u673a\u4fa7\u5b9e\u6d4b\u8be5\u4e3b\u673a ~2.5s\uff0c\u7559 15s \u4f59\u91cf\u8986\u76d6\u5f31\u7f51 */

function brief(v,n) { return (typeof v==='string'||typeof v==='number') ? String(v).substr(0,n).replace(/[\r\n\t]/g,' ') : 'ERROR'; }

function str(v) { return (v === undefined || v === null) ? '' : String(v); }
function num(v, d) { var n = Number(v); return isNaN(n) ? d : n; }

/* \u5185\u5bb9\u7b7e\u540d\uff1a\u4e0e rev/updatedAt \u65e0\u5173\uff0c\u53ea\u770b\u8bfe\u672c\u8eab \u2192 \u5224\u65ad\u300c\u5185\u5bb9\u662f\u5426\u771f\u7684\u53d8\u4e86\u300d
 * \u4e0d\u8fd9\u4e48\u505a\u7684\u540e\u679c\uff1areplaceDoc \u843d\u76d8\u4f1a rev+1\uff0c\u672c\u5730 rev \u6c38\u8fdc\u6bd4\u4e91\u7aef\u5927\uff0c
 * \u4e0b\u6b21\u62c9\u53d6\u5c31\u4f1a\u8bef\u5224\u6210\u300c\u672c\u5730\u8f83\u65b0\u300d\u800c\u6c38\u8fdc\u4e0d\u518d\u66f4\u65b0\u3002 */
function sig(doc) { return protocol.snapshot(doc); }

/* \u5f52\u4e00\u5316\uff1areplaceDoc \u76f4\u63a5\u628a\u5bf9\u8c61\u6302\u8fdb\u7f13\u5b58\uff0c\u5b57\u6bb5\u7f3a\u5931\u4f1a\u8ba9 serialize \u51fa\u95ee\u9898 \u2192 \u5148\u8865\u9f50 */
function normalize(remote) {
    protocol.snapshot(remote);
    var s=remote.settings;
    return {schema:SCHEMA,version:VERSION,rev:num(remote.rev,0),updatedAt:num(remote.updatedAt,0),
        settings:{semesterStart:s.semesterStart,currentWeek:num(s.currentWeek,1),
            vibrationEnabled:s.vibrationEnabled===undefined?true:!!s.vibrationEnabled,reminderMinutes:num(s.reminderMinutes,5)},
        courses:remote.courses};
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
            mk('\u672c\u5730\u8bfe\u8868', '\u8bfb\u53d6\u4e2d\u2026', '#6c6c80'),
            mk('\u4e91\u7aef\u8bfe\u8868', '\u5f85\u62c9\u53d6', '#6c6c80'),
            mk('\u53d6\u4ef6\u7801', '\u8bfb\u53d6\u4e2d\u2026', '#6c6c80'),
            mk('\u8fde\u901a\u81ea\u68c0', '\u5f85\u6d4b', '#6c6c80'),
            mk('\u624b\u673a\u540c\u6b65', '\u70b9\u51fb\u6253\u5f00', '#7c86e0')
        ];
        self.pickupCode = '';
        self.detail = '\u8bfb\u53d6\u53d6\u4ef6\u7801\u4e2d\u2026';

        self.loadCode(function () {
            self.detail = '\u4e91\u7aef ' + self.scheduleUrl();
            self.endpoint = (self.pickupCode.length === 6)
                ? 'kebiao.qingyun3.com\uff08\u53d6\u4ef6\u7801\uff09'
                : 'listenword.qingyun3.com/elcton\uff08\u4e2a\u4eba\uff09';
            self.refreshLocal(function () {
                self.health();
            });
        });
    },
    clearTimers: function () {
        clearTimeout(this.wdTimer);clearTimeout(this.reqTimer);clearTimeout(this.pageTimer);clearTimeout(this.mergeTimer);
        this.wdTimer=null;this.reqTimer=null;this.pageTimer=null;this.mergeTimer=null;
    },
    onHide: function () {
        this.dead=true;this.gen++;this.clearTimers();
        this.accText=[];this.meta=null;
        if(!this.committing){this.running=false;this.mode='';}
    },
    onDestroy: function () { this.onHide();data.clearCache(); },
    onShow: function () {if(!this.dead)return;this.dead=false;if(!this.committing)this.onRetry();},
    onBack: function () {
        if (this.committing) { return; }
        this.onHide();router.back();
    },
    /* \u70b9\u884c = \u4e0a\u4e0b\u6587\u52a8\u4f5c\uff1a\u81ea\u68c0\u884c\u91cd\u8dd1\u81ea\u68c0\u3001\u8bfe\u8868\u884c\u5237\u65b0\u672c\u5730\u3001\u5176\u4f59\u53ea\u770b\u8be6\u60c5 */
    onRowClick: function (idx) {
        if(this.dead || (this.running && !((idx===3 || idx===4) && this.mode==='health')))return;
        var r = this.rows[idx];
        if (!r) { return; }
        if (idx === 4) {
            if (this.committing) { return; }
            this.onHide();router.push({uri:'pages/phone-sync/phone-sync'});return;
        }
        if (idx === 2) { router.push({ uri: 'pages/code/code' }); return; }
        if (idx === 3) {
            /* \u624b\u52a8\u5f3a\u5236\u590d\u4f4d\uff1a\u4e0a\u4e00\u6b21\u8bf7\u6c42\u6302\u6b7b\uff08\u65ad\u7f51\u65f6 fetch \u65e0\u56de\u5305\uff09\u4f1a\u628a running \u5361 true\uff0c
             * health() \u5165\u53e3\u4e92\u65a5\u628a\u540e\u7eed\u70b9\u51fb\u9759\u9ed8\u541e\u6389 \u2192 \u70b9\u4e86\u6c38\u8fdc"\u68c0\u6d4b\u4e2d"\uff082026-10-12 \u5b9e\u6d4b\uff09\u3002
             * running \u590d\u4f4d + gen+1 \u4f5c\u5e9f\u65e7\u56de\u8c03/\u65e7\u770b\u95e8\u72d7\uff08httpGet finish \u6709 gen \u5b88\u536b\uff09\uff0c\u518d\u91cd\u53d1 */
            this.running = false;
            this.gen++;
            this.detail = '\u91cd\u8dd1\u81ea\u68c0\u2026';
            this.health();
            return;
        }
        if (idx === 0) { this.detail = '\u5237\u65b0\u672c\u5730\u2026'; this.refreshLocal(function () {}); return; }
        this.detail = r.name + '\uff1a' + r.status;
    },
    reject: function (code) {
        this.running=false;this.clearTimers();this.accText=[];
        this.setRow(1,'\u540c\u6b65\u5931\u8d25','#f44336');this.detail=String(code).substr(0,32);
    },
    setRow: function (i, status, color) {
        var list = this.rows.slice();
        if (!list[i]) { return; }
        list[i] = { name: list[i].name, status: status, color: color };
        this.rows = list;      /* \u9876\u5c42\u8d4b\u503c\u624d\u89e6\u53d1\u5237\u65b0 */
    },
    /* \u2500\u2500 \u8bca\u65ad\u4e8b\u4ef6\u73af\uff1a\u5173\u952e\u72b6\u6001\u6253\u77ed\u6807\u8bb0\uff1b\u62c9\u53d6\u884c\u5c3e\u9644\u6700\u540e\u6807\u8bb0\uff0c
     * \u771f\u673a\u518d\u5361\u6b7b\u65f6\u622a\u56fe\u4e00\u884c\u72b6\u6001\u5373\u53ef\u5b9a\u4f4d\u6b7b\u70b9\uff082026-10-10 \u5361\u6b7b\u6392\u67e5\u4fdd\u9669\u4e1d\uff09\u2500\u2500 */
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
    /* \u5168\u7a0b\u6ed1\u52a8\u770b\u95e8\u72d7\uff1a\u6bcf\u9875\u5230\u624b\u90fd\u91cd\u7f6e\uff1b\u9875\u95f4\u5b9a\u65f6\u5668\u5931\u6548 / fetch \u4e0d\u56de\u8c03 /
     * \u5904\u7406\u94fe\u51bb\u7ed3\u2014\u2014\u4efb\u4f55\u4e00\u79cd 15s \u540e\u90fd\u663e\u5f0f\u62a5\u9519\uff0c\u7edd\u4e0d\u65e0\u58f0\u5361\u6b7b */
    pokeWatchdog: function (gen) {
        var self = this;
        try { clearTimeout(self.wdTimer); } catch (e) {}
        self.wdTimer = setTimeout(function () {
            /* running=false = \u94fe\u5df2\u505c\uff08\u62a5\u9519/\u5b8c\u6210\uff09\uff0c\u9057\u7559 timer \u76f4\u63a5\u5ffd\u7565\uff0c\u4e0d\u8bb8\u8986\u76d6\u72b6\u6001 */
            if (self.dead || gen !== self.gen || !self.running) { return; }
            if(self.committing){self.detail='COMMIT_UNCERTAIN';return;}
            self.running = false;self.mode='';self.clearTimers();
            self.pushTrace('TO');
            self.setRow(1, '\u2717 \u505c\u6ede\u8d85\u65f6', '#f44336');
            self.detail = '\u770b\u95e8\u72d7\u8d85\u65f6 \u00b7 \u6700\u540e\u4f4d\u7f6e: ' + self.traceStr();
        }, self.watchdogMs || 15000);
    },
    /* \u8bfb\u53d6\u4ef6\u7801\uff08\u952e\u76d8\u9875\u5199\u5728 internal://app/sync.code.txt\uff0c6 \u5b57\u8282\uff09 */
    loadCode: function (cb) {
        var self = this;
        var done = function (v) {
            self.pickupCode = v;
            if (v.length === 6) {
                self.setRow(2, '\u5df2\u8bbe\u7f6e ' + v, '#4caf50');
            } else {
                self.setRow(2, '\u672a\u8bbe\u7f6e \u00b7 \u70b9\u8fd9\u91cc\u586b', '#ffc107');
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
        var self = this, gen=this.gen;
        try {
            data.getDoc(function (doc) {
                if(self.dead||gen!==self.gen)return;
                if (doc) {
                    self.localRev = num(doc.rev, 0);
                    self.localCount = (doc.courses && doc.courses.length) ? doc.courses.length : 0;
                    self.setRow(0, 'rev ' + self.localRev + ' \u00b7 ' + self.localCount + ' \u95e8', '#7c86e0');
                }
                if (cb) { cb(); }
            });
        } catch (e) {
            self.setRow(0, '\u8bfb\u53d6\u5f02\u5e38', '#f44336');
            if (cb) { cb(); }
        }
    },

    /* \u2500\u2500 \u901a\u7528 GET\uff1a\u770b\u95e8\u72d7 + \u4ee3\u9645\u5b88\u536b + \u56de\u8c03\u5168\u5305 try \u2500\u2500 */
    httpGet: function (url, gen, cb) {
        var self = this;
        if (!self.fetchApi || !self.fetchApi.fetch) {
            cb(false, '@system.fetch \u4e0d\u53ef\u7528', -100);
            return;
        }
        var done = false;
        var finish = function (ok, payload, code) {
            if (done || self.dead || gen !== self.gen) { return; }
            done = true;
            try { clearTimeout(self.reqTimer); } catch (e) {}
            /* cb \u629b\u5f02\u5e38\u7edd\u4e0d\u80fd\u88ab\u5916\u5c42 catch \u541e\uff1a\u541e\u6389 = \u94fe\u65ad + \u5355\u8bf7\u6c42\u770b\u95e8\u72d7\u5df2\u6e05 +
             * \u65e0\u4efb\u4f55\u62a5\u9519 = \u65e0\u58f0\u51bb\u7ed3\uff082026-10-10 \u771f\u673a 4/6 \u5361\u6b7b\u7684\u653e\u5927\u5668\uff09\u2192 \u663e\u5f0f\u62a5\u51fa */
            try { cb(ok, payload, code); }
            catch (e) {
                self.running = false;
                self.pushTrace('Ecb');
                self.setRow(1, '\u2717 \u5904\u7406\u5f02\u5e38', '#f44336');
                self.detail = 'CALLBACK_ERROR '+self.traceStr();
            }
        };
        try {
            self.reqTimer = setTimeout(function () {
                finish(false, 'TIMEOUT', -99);
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
                    } catch (e) { finish(false, 'RESPONSE_ERROR', -98); }
                },
                fail: function (res, code) {
                    try {
                        finish(false, brief(res, 70), (code === undefined || code === null) ? -97 : code);
                    } catch (e) { finish(false, 'RESPONSE_ERROR', -96); }
                }
            });
        } catch (e) {
            finish(false, 'FETCH_ERROR', -95);
        }
    },

    /* \u2500\u2500 \u8fdb\u9875\u9762\u81ea\u52a8\u6253\u4e00\u6b21\u63a2\u6d3b\uff08\u51e0\u5b57\u8282\uff0c\u6700\u5feb\uff0c\u7528\u6765\u5206\u6e05\u7f51\u7edc\u95ee\u9898\u548c\u6570\u636e\u95ee\u9898\uff09 \u2500\u2500 */
    health: function () {
        var self = this;
        if (self.dead || self.running) { return; }
        self.mode='health';
        if (!self.fetchApi) {
            self.setRow(3, 'fetch \u6a21\u5757\u4e0d\u53ef\u7528', '#f44336');
            self.detail = '@system.fetch \u52a0\u8f7d\u5931\u8d25';
            return;
        }
        self.running = true;
        self.gen++;
        var gen = self.gen;
        self.setRow(3, '\u6d4b\u8bd5\u4e2d\u2026', '#ffc107');
        self.httpGet(HEALTH_URL, gen, function (ok, payload, code) {
            self.running = false;
            if (ok && String(payload).indexOf('ok') >= 0) {
                self.setRow(3, '\u2713 \u901a ' + code, '#4caf50');
                self.detail = '\u81ea\u68c0 ' + brief(payload, 40);
            } else if (ok) {
                self.setRow(3, '\u2713 \u901a\u4f46\u5185\u5bb9\u5f02\u5e38', '#ffc107');
                self.detail = 'HTTP '+code+' \u8bf7\u91cd\u8bd5';
            } else {
                self.setRow(3, '\u2717 ' + code, '#f44336');
                self.detail = '\u7f51\u7edc\u5931\u8d25 '+brief(code,8);
            }
        });
    },

    /* \u2500\u2500 \u62c9\u53d6\u8bfe\u8868\uff08\u5207\u7247\u7248\uff09\uff1a
     * 60 \u8bfe\u6574\u4efd \u224812KB \u4e00\u6b21\u7ed9 Lite \u4f1a\u5361\u6b7b\uff082026-10-10 \u771f\u673a\u4e8b\u6545\uff09\u2192 \u670d\u52a1\u7aef\u6309
     * 20\u8bfe/\u9875 \u5207\u7247\uff0c\u8fd9\u91cc\u9010\u9875\u4e32\u884c\u62c9\uff1a\u9875\u95f4 50ms \u653e\u884c\uff08Lite \u56de\u8c03\u53ef\u80fd\u540c\u6b65\u6d3e\u53d1\uff0c
     * \u76f4\u63a5\u9012\u5f52=\u53d8\u76f8\u5e76\u53d1=\u5361\u6b7b\uff09\u3001\u9875\u95f4 rev/updatedAt \u4e00\u81f4\u6027\u6821\u9a8c\u3002
     * \u670d\u52a1\u7aef\u4e0d\u652f\u6301 page \u53c2\u6570\u65f6\u5ffd\u7565\u4e4b\u5e76\u8fd4\u56de\u6574\u4efd \u2192 \u65e0 slice \u5b57\u6bb5\u8d70\u8001\u6d41\u7a0b\uff08\u964d\u7ea7\uff09\u3002 */
    onPull: function () {
        var self = this;
        if (self.running) {
            self.detail = '\u8bf7\u7b49\u5f85\u5f53\u524d\u64cd\u4f5c';
            return;
        }
        if (!self.fetchApi) {
            self.setRow(1, 'fetch \u6a21\u5757\u4e0d\u53ef\u7528', '#f44336');
            self.detail = '@system.fetch \u52a0\u8f7d\u5931\u8d25';
            return;
        }
        if(self.dead)return;
        self.mode='pull';self.committing=false;
        self.running = true;
        self.gen++;
        var gen = self.gen;
        self.trace = [];
        /* \u6587\u672c\u7d2f\u79ef\uff1a\u6bcf\u9875 courses \u5e8f\u5217\u5316\u6210\u5b57\u7b26\u4e32\u5b58\u653e\uff0c\u9875\u5bf9\u8c61\u7acb\u5373\u53ef\u56de\u6536\u3002
         * \u4e0d\u518d\u8ba9 60 \u8bfe\u5bf9\u8c61\u6811\u968f\u9875\u6570\u6e10\u8fdb\u589e\u957f\u2014\u2014\u51e0\u5341 KB \u7684 JerryScript \u5806\u4e0a
         * \u6e10\u8fdb\u5230 40 \u8bfe\u5373\u903c\u8fd1 OOM\uff08\u4e24\u7248\u5207\u7247\u90fd\u6070\u597d\u5361\u5728\u7d2f\u8ba1 40 \u8bfe\uff09 */
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
        self.setRow(1, (self.meta ? ('\u62c9\u53d6\u7b2c ' + (n + 1) + '/' + self.meta.pages + ' \u9875\u2026') : '\u62c9\u53d6\u4e2d\u2026') +
                      ' \u2039' + self.traceLast() + '\u203a', '#ffc107');

        self.httpGet(url, gen, function (ok, payload, code) {
            if (self.dead || gen !== self.gen) { return; }
            if (!ok) {
                self.reject('NETWORK_ERROR');return;
            }
            if (code >= 400) {
                self.reject('HTTP_ERROR');return;
            }
            var remote = null;
            try { remote = JSON.parse(payload); } catch (e) { remote = null; }
            if (!remote || typeof remote !== 'object') {
                self.reject('INVALID_JSON');return;
            }
            if (remote.slice === true) { self.gotSlice(remote, n, gen); return; }
            if(self.meta){self.running=false;self.clearTimers();self.detail='INVALID_SLICE_CHAIN';return;}
            /* \u6574\u4efd\u54cd\u5e94\uff08\u8001\u670d\u52a1\u7aef\u5ffd\u7565 page / \u65e0\u7801 legacy \u8def\u7ebf\uff09\u2192 \u8001\u6d41\u7a0b */
            self.finishDoc(remote, gen);
        });
    },

    /* \u4e00\u9875\u5230\u624b\uff1a\u6821\u9a8c \u2192 \u6587\u672c\u7d2f\u79ef \u2192 \u4e32\u884c\u4e0b\u4e00\u9875 / \u6536\u9f50\u5408\u5e76 */
    gotSlice: function (r, n, gen) {
        var self = this;
        if (self.dead || gen !== self.gen) { return; }
        self.pushTrace('p' + n + '<');
        self.pokeWatchdog(gen);
        if (r.schema !== SCHEMA) {
            self.reject('INVALID_SCHEMA');return;
        }
        if (r.version !== VERSION || typeof r.page !== 'number' || r.page !== n ||
            typeof r.pages !== 'number' || r.pages !== Math.floor(r.pages) || r.pages<1 || r.pages>20 ||
            typeof r.total !== 'number' || r.total !== Math.floor(r.total) || r.total<0 || r.total>200 ||
            Object.prototype.toString.call(r.courses)!=='[object Array]' || r.courses.length>10) {
            self.running=false;self.clearTimers();self.detail='INVALID_SLICE';return;
        }
        try {protocol.snapshot(r);}catch(e){self.running=false;self.clearTimers();self.detail='INVALID_SLICE_DOC';return;}
        if (n === 0) {
            self.meta = {
                schema: r.schema, version: num(r.version, 1),
                rev: num(r.rev, 0), updatedAt: num(r.updatedAt, 0),
                pages: num(r.pages, 1), settings: (r.settings && typeof r.settings === 'object') ? r.settings : {},
                total: num(r.total, 0)
            };
        } else if (!self.meta || num(r.rev, -1) !== self.meta.rev || num(r.updatedAt, -1) !== self.meta.updatedAt) {
            self.reject('REMOTE_CHANGED');return;
        }
        if (r.pages !== self.meta.pages || r.total !== self.meta.total || r.version !== self.meta.version) {
            self.reject('INVALID_PAGE_COUNT');return;
        }
        var list = (r.courses && r.courses.length) ? r.courses : [];
        /* \u6587\u672c\u7d2f\u79ef\uff1a\u672c\u9875\u5e8f\u5217\u5316\u6210\u5b57\u7b26\u4e32\u540e\u5373\u4e22\uff0c\u9875\u5bf9\u8c61\u53ef\u56de\u6536\u2014\u2014\u5bf9\u8c61\u6811\u6e10\u8fdb\u5230
         * 40 \u8bfe\u5c31\u5728\u51e0\u5341 KB \u7684 JerryScript \u5806\u4e0a\u903c\u8fd1 OOM\uff08\u4e24\u7248\u90fd\u6070\u597d\u5361\u5728 40 \u8bfe\uff09\u3002
         * \u6bb5\u683c\u5f0f='{..},{..}'\uff08\u65e0\u5916\u5c42\u6570\u7ec4\u62ec\u53f7\uff09\u2192 \u5408\u5e76\u65f6\u7edf\u4e00\u5305\u4e00\u5c42\uff0c\u9632\u53cc\u91cd\u5d4c\u5957 */
        if (list.length) {
            var parts = [];
            for (var i = 0; i < list.length; i++) { parts.push(JSON.stringify(list[i])); }
            self.accText.push(parts.join(','));
            self.accCount += list.length;
        }
        self.setRow(1, '\u62c9\u53d6 ' + (n + 1) + '/' + self.meta.pages + ' \u9875 \u00b7 ' + self.accCount + ' \u8bfe' +
                      ' \u2039' + self.traceLast() + '\u203a', '#ffc107');
        self.detail = '\u5207\u7247\u8fdb\u5ea6 ' + (n + 1) + '/' + self.meta.pages + '\uff08' + self.accCount + '/' + self.meta.total + ' \u8bfe\uff09';
        if ((n + 1) < self.meta.pages) {
            /* \u9875\u95f4 400ms \u653e\u884c\uff1aLite \u56de\u8c03\u53ef\u80fd\u540c\u6b65\u6d3e\u53d1\uff08\u76f4\u63a5\u9012\u5f52=\u53d8\u76f8\u5e76\u53d1=\u5361\u6b7b\uff09\uff0c
             * \u4e14\u6bcf\u9875\u540e\u7ed9\u7f51\u7edc\u6808/\u4e8b\u4ef6\u5faa\u73af\u5598\u606f\u2014\u2014\u56de\u8c03\u5185\u518d\u5305 try\uff0c\u5f02\u5e38\u663e\u5f0f\u62a5\u51fa */
            self.pushTrace('w');
            try {
                self.pageTimer = setTimeout(function () {
                    if (self.dead || gen !== self.gen) { return; }
                    try { self.pullPage(n + 1, gen); }
                    catch (e) {
                        self.running = false;
                        self.pushTrace('Epg');
                        self.setRow(1, '\u2717 \u5206\u9875\u5f02\u5e38', '#f44336');
                        self.detail = 'PAGE_ERROR '+self.traceStr();
                    }
                }, 400);
            } catch (e) {
                self.running = false;
                self.setRow(1, '\u2717 \u5b9a\u65f6\u5668\u5931\u8d25', '#f44336');
                self.detail = 'TIMER_ERROR';
            }
            return;
        }
        /* \u6536\u9f50 \u2192 \u6700\u91cd\u7684\u6574\u4efd\u5904\u7406\uff08\u5408\u5e76/normalize/\u6bd4\u5bf9/\u843d\u76d8\uff09\u5ef6\u540e 100ms \u5355\u72ec\u4e00\u62cd\uff0c
         * \u4e0d\u4e0e\u6700\u540e\u4e00\u6b21 fetch \u56de\u8c03\u6324\u5728\u540c\u4e00\u4e2a\u4e8b\u4ef6\u5faa\u73af\u91cc\uff1b\u6574\u6bb5\u5305 try \u663e\u5f0f\u62a5\u9519 */
        if(self.accCount!==self.meta.total){self.running=false;self.clearTimers();self.accText=[];self.detail='INCOMPLETE_SLICE';return;}
        self.pushTrace('mg');
        self.mergeTimer = setTimeout(function () {
            if (self.dead || gen !== self.gen) { return; }
            try {
                /* \u9010\u6bb5\u89e3\u6790\u800c\u975e\u4e00\u6b21\u6027 join \u5927\u4e32\uff1a\u6e90\u4e32+\u5bf9\u8c61\u6811\u4f1a\u53cc\u4efd\u5360\u5806\uff0864/256KB\uff09\uff0c
                 * \u5206\u6bb5\u540e\u5cf0\u503c = \u5df2\u7d2f\u79ef\u5bf9\u8c61 + 1.8KB \u6bb5\u6587\u672c\uff1b\u6bcf\u6bb5\u89e3\u6790\u5b8c\u7acb\u5373\u7f6e\u7a7a\u91ca\u653e */
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
                    self.reject('INVALID_DOCUMENT');return;
                }
                self.decide(normalized, gen);
            } catch (e2) {
                self.running = false;
                self.pushTrace('Emg');
                self.setRow(1, '\u2717 \u5408\u5e76\u5f02\u5e38', '#f44336');
                self.detail = 'MERGE_ERROR '+self.traceStr();
            }
        }, 100);
    },

    /* \u6574\u4efd\u54cd\u5e94\u5904\u7406\uff08\u8001\u6d41\u7a0b\uff09\uff1a\u517c\u5bb9\u5305\u88c5 \u2192 schema/version \u6821\u9a8c \u2192 decide */
    finishDoc: function (remote, gen) {
        var self = this;
        self.pushTrace('doc');
        if (!remote.schema && remote.doc && typeof remote.doc === 'object') {
            remote = remote.doc;
        }
        if (remote.schema !== SCHEMA) {
            self.reject('INVALID_SCHEMA');return;
        }
        if (num(remote.version, 0) > VERSION) {
            self.reject('UNSUPPORTED_VERSION');return;
        }
        var normalized = null;
        var normErr = null;
        try { normalized = normalize(remote); } catch (e2) { normalized = null; normErr = e2; }
        if (!normalized) {
            self.reject('INVALID_DOCUMENT');return;
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
                    self.reject('LOCAL_READ_ERROR');return;
                }
                var same = false;
                try {
                    /* \u957f\u5ea6\u77ed\u8def\uff1a\u8bfe\u6570\u4e0d\u540c\u5fc5\u4e0d\u7b49 \u2192 \u8df3\u8fc7\u4e24\u6b21 sig \u6784\u9020
                     * \uff0860 \u8bfe sig\u22484KB \u00d72\uff0c\u51e0\u5341 KB \u5806\u4e0a\u662f\u53ef\u89c2\u7684\u77ac\u65f6\u5cf0\u503c\uff09 */
                    var lc = (local.courses && local.courses.length) ? local.courses.length : 0;
                    if (lc === remote.courses.length) { same = (sig(local) === sig(remote)); }
                } catch (e) { same = false; }

                if (same) {
                    self.running = false;self.clearTimers();
                    self.pendingForce = false;
                    self.setRow(1, '\u2713 \u5df2\u662f\u6700\u65b0 rev ' + remote.rev, '#4caf50');
                    self.detail = '\u5185\u5bb9\u76f8\u540c\uff0c\u65e0\u9700\u5bfc\u5165';
                    return;
                }
                var localRev = num(local.rev, 0);
                if (remote.rev <= localRev && !self.pendingForce) {
                    self.running = false;self.clearTimers();
                    self.pendingForce = true;
                    self.setRow(1, '\u672c\u5730\u6709\u6539\u52a8', '#ffc107');
                    self.detail = '\u672c\u5730\u6709\u6539\u52a8\uff0c\u518d\u70b9\u62c9\u53d6\u786e\u8ba4\u8986\u76d6';
                    return;
                }
                self.apply(remote, gen);
            });
        } catch (e) {
            self.running = false;
            self.setRow(1, '\u2717 \u5f02\u5e38', '#f44336');
            self.detail = 'COMPARE_ERROR';
        }
    },

    apply: function (remote, gen) {
        var self = this;
        self.pushTrace('app');
        self.committing=true;
        try {
            data.replaceDoc(remote, function (ok) {
                self.committing=false;self.running=false;
                if (self.dead || gen !== self.gen) { return; }
                self.clearTimers();
                if (ok) {
                    self.pendingForce = false;
                    self.pushTrace('ok');
                    self.setRow(1, '\u2713 \u5df2\u5bfc\u5165 rev ' + remote.rev, '#4caf50');
                    self.detail = '\u5df2\u4fdd\u5b58 '+remote.courses.length+' \u8bfe';
                    self.refreshLocal(function () { self.setRow(1, '\u2713 \u5df2\u5bfc\u5165 \u00b7 \u672c\u5730 rev ' + self.localRev, '#4caf50'); });
                } else {
                    self.setRow(1, '\u2717 \u843d\u76d8\u5931\u8d25', '#f44336');
                    self.detail = '\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u91cd\u8fde\u6838\u5bf9';
                }
            });
        } catch (e) {
            self.running = false;
            self.pushTrace('Eap');
            self.setRow(1, '\u2717 \u5f02\u5e38', '#f44336');
            self.detail = 'SAVE_ERROR '+self.traceStr();
        }
    },

    onRetry: function () {
        var self = this;
        if(self.dead||self.running||self.committing)return;
        self.pendingForce = false;
        self.gen++;                 /* \u4e22\u5f03\u5728\u9014\u56de\u8c03\uff0c\u91cd\u65b0\u5f00\u59cb */
        try { clearTimeout(self.wdTimer); } catch (e) {}
        try { clearTimeout(self.reqTimer); } catch (e) {}
        try { clearTimeout(self.pageTimer); } catch (e) {}
        self.running = false;
        self.trace = [];
        self.setRow(1, '\u5f85\u62c9\u53d6', '#6c6c80');
        self.setRow(3, '\u5f85\u6d4b', '#6c6c80');
        self.refreshLocal(function () { self.health(); });
    }
};
