import fs from '../../common/fs.js';
import router from '../../common/router.js';


/* \u53d6\u4ef6\u7801\u8f93\u5165\u9875 \u2014\u2014 Lite \u6ca1\u6709\u7cfb\u7edf\u8f93\u5165\u6cd5\uff08\u771f\u673a\u5b9e\u6d4b\uff1ainput type=text \u4e00\u78b0\u5c31\u5d29\uff09\uff0c
 * \u6240\u4ee5\u952e\u76d8\u5fc5\u987b\u81ea\u5df1\u753b\u30026 \u4f4d\u7eaf\u6570\u5b57\uff0c3\u00d74 \u5e03\u5c40\uff0c\u5b58 internal://app/sync.code.txt
 * \uff086 \u5b57\u8282\uff0c\u8fdc\u4f4e\u4e8e @system.storage 128B \u7ea2\u7ebf\uff0c\u8fd9\u91cc\u7edf\u4e00\u8d70 file \u4e0e\u5176\u5b83\u6570\u636e\u4e00\u81f4\uff09\u3002
 *
 * \u4ea4\u4e92\uff1a\u70b9\u6570\u5b57\u8ffd\u52a0\u3001\u70b9\u5220\u9664\u9000\u4e00\u4f4d\u3001\u6ee1 6 \u4f4d\u624d\u80fd\u786e\u5b9a\uff1b
 * \u53d6\u6d88/\u786e\u5b9a\u90fd\u8df3\u56de\u540c\u6b65\u9875\uff08router.push \u5b9e\u9645\u662f replace\uff0c\u65e0\u6cd5\u8fd4\u56de\u4e0a\u4e00\u9875\u6808\uff09\u3002
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
        digits: '\u00b7 \u00b7 \u00b7 \u00b7 \u00b7 \u00b7',
        hint: '\u5728\u7f51\u9875\u4e0a\u5efa\u597d\u8bfe\u8868\uff0c\u628a 6 \u4f4d\u53d6\u4ef6\u7801\u8f93\u5728\u8fd9\u91cc',
        keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '\u5220\u9664', '0', '']
    },
    onInit: function () {

        this.dead = false;
        this.value = '';this._editGen=0;this._saveGen=0;this._saving=false;
        var self=this,gen=this._editGen;
        try {
            fs.readFile(URI, function (code, text) {
                if (self.dead||gen!==self._editGen) { return; }
                if (code === undefined || code === null) {
                    self.value = digitsOnly(text);
                    if (self.value.length === 6) {
                        self.hint = '\u5df2\u586b\u5165\u4e4b\u524d\u4fdd\u5b58\u7684\u53d6\u4ef6\u7801\uff0c\u53ef\u76f4\u63a5\u6539';
                    }
                }
                self.paint();
            });
        } catch (e) {
            self.paint();
        }
        this.paint();
    },
    onHide: function () {this.dead=true;this._editGen++;},
    onDestroy: function () {this.onHide();},
    onShow: function () {this.dead=false;},
    paint: function () {
        var s = '';
        for (var i = 0; i < 6; i++) {
            s += (i < this.value.length) ? this.value.charAt(i) : '\u00b7';
            if (i < 5) { s += ' '; }
        }
        this.digits = s;      /* \u9876\u5c42 data \u5b57\u6bb5 + \u9876\u5c42\u8d4b\u503c\u624d\u5237\u65b0 */
    },
    onKey: function (idx) {
        if(this.dead||this._saving)return;this._editGen++;
        var k = this.keys[idx];
        if (k === undefined || k === null || k === '') { return; }
        if (k === '\u5220\u9664') {
            this.value = this.value.substring(0, this.value.length - 1);
        } else if (this.value.length < 6) {
            this.value = this.value + k;
        }
        if (this.value.length === 6) {
            this.hint = '\u586b\u597d\u4e86\uff0c\u70b9\u300c\u786e\u5b9a\u300d\u4fdd\u5b58';
        } else {
            this.hint = '\u8fd8\u5dee ' + (6 - this.value.length) + ' \u4f4d';
        }
        this.paint();
    },
    onCancel: function () {
        this.onHide();router.push({ uri: 'pages/sync/sync' });
    },
    onOk: function () {
        var self=this;if(self.dead||self._saving)return;
        if (!/^[0-9]{6}$/.test(self.value)) {
            self.hint = '\u53d6\u4ef6\u7801\u662f 6 \u4f4d\u6570\u5b57\uff0c\u8fd8\u5dee ' + (6 - self.value.length) + ' \u4f4d';
            return;
        }
        self.hint = '\u4fdd\u5b58\u4e2d\u2026';self._saving=true;var gen=++self._saveGen,view=self._editGen,value=self.value,done=false;
        try {
            fs.writeFile(URI, value, function (code) {
                if(done||gen!==self._saveGen)return;done=true;self._saving=false;
                if (self.dead||view!==self._editGen) { return; }
                if (code !== undefined && code !== null) {
                    self.hint = '\u5199\u5165\u5931\u8d25 code=' + code;
                    return;
                }
                router.push({ uri: 'pages/sync/sync' });
            });
        } catch (e) {
            self._saving=false;self._saveGen++;self.hint = '\u5f02\u5e38\uff1a\u5199\u5165\u629b\u9519';
        }
    }
};
