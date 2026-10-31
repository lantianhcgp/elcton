import fs from '../../common/fs.js';
import router from '../../common/router.js';
import ui from '../../common/watchUi.js';

/* 取件码输入页 —— Lite 没有系统输入法（真机实测：input type=text 一碰就崩），
 * 所以键盘必须自己画。6 位纯数字，3×4 布局，存 internal://app/sync.code.txt
 * （6 字节，远低于 @system.storage 128B 红线，这里统一走 file 与其它数据一致）。
 *
 * 交互：点数字追加、点删除退一位、满 6 位才能确定；
 * 取消/确定都跳回同步页（router.push 实际是 replace，无法返回上一页栈）。
 */
var URI = 'internal://app/sync.code.txt';

function digitsOnly(s) {
    var out = '';
    s = String(s === undefined || s === null ? '' : s);
    for (var i = 0; i < s.length; i++) {
        var cc = s.charCodeAt(i);
        if (cc >= 48 && cc <= 57 && out.length < 6) { out += s.charAt(i); }
    }
    return out;
}

export default {
    data: {
        ready:false,layoutError:'',w:0,h:0,top:0,bottom:0,paneW:0,headerH:0,bodyH:0,footerH:0,
        titleSize:18,textSize:14,smallSize:13,digitsH:0,hintH:0,padH:0,keyW:0,keyH:0,keyGap:0,keyGapY:0,
        buttonW:0,buttonH:0,gap:0,
        digits: '· · · · · ·',
        hint: '\u8bf7\u8f93\u5165\u7f51\u9875\u4e0a\u76846\u4f4d\u53d6\u4ef6\u7801',
        keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '删除', '0', '']
    },
    onInit: function () {
        ui.init(this,'code');
        this.dead = false;
        this.value = '';
        var self = this;
        try {
            fs.readFile(URI, function (code, text) {
                if (self.dead) { return; }
                if (code === undefined || code === null) {
                    self.value = digitsOnly(text);
                    if (self.value.length === 6) {
                        self.hint = '\u5df2\u8f7d\u5165\u53d6\u4ef6\u7801\uff0c\u53ef\u76f4\u63a5\u4fee\u6539';
                    }
                }
                self.paint();
            });
        } catch (e) {
            self.paint();
        }
        this.paint();
    },
    onDestroy: function () {
        this.dead = true;
        this._uiGen++;
    },
    paint: function () {
        var s = '';
        for (var i = 0; i < 6; i++) {
            s += (i < this.value.length) ? this.value.charAt(i) : '·';
            if (i < 5) { s += ' '; }
        }
        this.digits = s;      /* 顶层 data 字段 + 顶层赋值才刷新 */
    },
    onKey: function (idx) {
        var k = this.keys[idx];
        if (k === undefined || k === null || k === '') { return; }
        if (k === '删除') {
            this.value = this.value.substring(0, this.value.length - 1);
        } else if (this.value.length < 6) {
            this.value = this.value + k;
        }
        if (this.value.length === 6) {
            this.hint = '填好了，点「确定」保存';
        } else {
            this.hint = '还差 ' + (6 - this.value.length) + ' 位';
        }
        this.paint();
    },
    onCancel: function () {
        router.push({ uri: 'pages/sync/sync' });
    },
    onOk: function () {
        var self = this;
        if (self.value.length !== 6) {
            self.hint = '\u97006\u4f4d\u6570\u5b57\uff0c\u8fd8\u5dee' + (6 - self.value.length) + '\u4f4d';
            return;
        }
        self.hint = '保存中…';
        try {
            fs.writeFile(URI, self.value, function (code) {
                if (self.dead) { return; }
                if (code !== undefined && code !== null) {
                    self.hint = '写入失败 code=' + code;
                    return;
                }
                router.push({ uri: 'pages/sync/sync' });
            });
        } catch (e) {
            self.hint = '异常：写入抛错';
        }
    }
};
