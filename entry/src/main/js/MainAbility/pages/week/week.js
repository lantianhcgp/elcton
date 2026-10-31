import router from '../../common/router.js';
import data from '../../common/data.js';
import storage from '@system.storage';
import utils from '../../common/utils.js';
import { DAY_NAMES, DAY_NAMES_SHORT, COURSE_COLORS, PERIOD_TIMES } from '../../common/constants.js';
import ui from '../../common/watchUi.js';
import crownFocus from '../../common/crownFocus.js';

export default {
    data: {
        ready:false, layoutError:'', w:0, h:0, top:0, bottom:0, paneW:0, headerH:0, bodyH:0, footerH:0,
        titleSize:18, textSize:14, smallSize:13, rowH:0, cardH:0, cardInnerW:0, cardNameH:0, cardMetaH:0,
        cardTimeH:0, tabsH:0, tabW:0, tabH:0, tabGap:3, listH:0, buttonW:0, buttonH:0, gap:0,
        /* data \u521d\u503c\u5fc5\u987b\u662f\u5b57\u9762\u91cf\uff1a\u975e\u5b57\u9762\u91cf(IIFE/\u51fd\u6570\u8c03\u7528)\u5728\u7f16\u8bd1\u671f\u4f1a\u88ab\u4e22\u6389\uff0c\u5c5e\u6027\u8fdb\u4e0d\u4e86 VM\uff0c
         * \u4e4b\u540e\u518d\u8d4b\u503c\u4e5f\u4e0d\u89e6\u53d1\u91cd\u7ed8 \u2014\u2014 \u80f6\u56ca\u7a7a\u6587\u5b57\u7684\u6839\u56e0\u3002\u771f\u5b9e\u503c\u7531 onInit \u540c\u6b65\u7b97\u51fa(\u540c\u7d22\u5f15\u9875\u65e5\u671f)\u3002 */
        currentWeek: 1,
        weekDisplay: '\u5355',   /* \u515c\u5e95\u975e\u7a7a\uff0c\u4e0e refreshLabel \u9996\u5e27\u4e00\u81f4 */
        weekMode: 'auto',   /* auto=\u8ddf\u968f\u5f53\u524d\u5468 | odd=\u5355\u5468\u8bfe | even=\u53cc\u5468\u8bfe */
        selectedDay: 1,
        days: [{id:1,label:'\u4e00'},{id:2,label:'\u4e8c'},{id:3,label:'\u4e09'},{id:4,label:'\u56db'},{id:5,label:'\u4e94'},{id:6,label:'\u516d'},{id:7,label:'\u65e5'}],
        dayCourses: [],
        isEmpty: true
    },
    onInit: function () {
        this.dead=false; ui.init(this, 'week', crownFocus);
        this.selectedDay = utils.getDayOfWeek();
        /* \u540c\u6b65\u7b97\u4e00\u6b21\uff08\u4e0d\u7b49 IO \u56de\u8c03\uff09\uff1a\u5148\u6309\u9ed8\u8ba4\u5b66\u671f\u8d77\u59cb\u7b97\uff0cloadSettings \u56de\u8c03\u56de\u6765\u518d\u6309\u8bbe\u7f6e\u6821\u6b63 */
        this.currentWeek = utils.calculateCurrentWeek('2026-09-01');
        this.refreshLabel();
        this.loadData();
    },
    onShow: function () {
        this.dead=false; ui.init(this, 'week', crownFocus);
        data.clearCache();
        this.loadData();
        this.enableRotation('courseList', true);
    },
    onHide: function () {
        this.dead=true;this._uiGen++;this._loadGen=(this._loadGen||0)+1;this._dayGen=(this._dayGen||0)+1;
        clearTimeout(this._focusTimer);this._focusTimer=null;
        this.enableRotation('courseList', false);
    },
    onDestroy: function () {
        this.onHide();data.clearCache();
    },
    enableRotation: function (ref, value) {
        var r = this.$refs[ref];
        if (r && r.rotation) {
            r.rotation({ focus: value });
        }
    },
    onDaySelect: function (day) {
        this.selectedDay = day;
        this.loadDayCourses();
    },
    /* \u5355\u53cc\u5468\u5207\u6362\u6309\u94ae\uff082026-10-11 \u53cd\u9988\uff09\uff1a\u70b9 header \u53f3\u4fa7\u6807\u7b7e\u5faa\u73af
     * \u672c\u5468(\u81ea\u52a8) \u2192 \u5355\u5468\u8bfe \u2192 \u53cc\u5468\u8bfe \u2192 \u672c\u5468\uff0c\u6807\u7b7e\u59cb\u7ec8\u6807\u6ce8\u5f53\u524d\u663e\u793a\u7684\u662f\u5355\u8fd8\u662f\u53cc */
    onWeekModeClick: function () {
        var next = { auto: 'odd', odd: 'even', even: 'auto' };
        this.weekMode = next[this.weekMode] || 'auto';
        this.refreshLabel();
        this.loadDayCourses();
    },
    refreshLabel: function () {
        /* \u53ea\u7559\u300c\u5355/\u53cc\u300d\u4e24\u5b57\uff1a\u52a0"\u7b2cX\u5468"\u6574\u884c\u4f1a\u8d85\u51fa\u80f6\u56ca\u88ab\u622a\uff08\u7528\u6237\u771f\u673a\u622a\u56fe\u5b9e\u8bc1\uff09 */
        var par = (this.currentWeek % 2 === 1) ? '\u5355' : '\u53cc';
        if (this.weekMode === 'odd') { par = '\u5355'; }
        if (this.weekMode === 'even') { par = '\u53cc'; }
        this.weekDisplay = par;
    },
    effectiveWeek: function () {
        if (this.weekMode === 'odd') { return 1; }    /* \u5947\u6570\u5468\u4ee3\u8868\uff08\u8fc7\u6ee4\u53ea\u770b\u5947\u5076\uff09 */
        if (this.weekMode === 'even') { return 2; }   /* \u5076\u6570\u5468\u4ee3\u8868 */
        return this.currentWeek;
    },
    loadData: function () {
        var self=this,gen=(this._loadGen||0)+1;this._loadGen=gen;
        data.loadSettings(function (settings) {
            if (self.dead || gen!==self._loadGen) { return; }
            self.currentWeek = utils.calculateCurrentWeek(settings.semesterStart);
            self.refreshLabel();
            self.loadDayCourses();
        });
    },
    loadDayCourses: function () {
        var self=this,gen=(this._dayGen||0)+1;this._dayGen=gen;
        data.getCoursesForDay(self.selectedDay, self.effectiveWeek(), function (courses) {
            if (self.dead || gen!==self._dayGen) { return; }
            var list = [];
            var now = utils.getCurrentMinutes();
            var today = utils.getDayOfWeek();
            for (var i = 0; i < courses.length; i++) {
                var c = courses[i];
                var startMin = utils.timeToMinutes(c.startTime);
                var endMin = utils.timeToMinutes(c.endTime);
                var statusColor = '#4caf50';
                if (self.selectedDay < today || (self.selectedDay === today && now >= endMin)) {
                    statusColor = '#f44336';
                } else if (self.selectedDay === today && now >= startMin && now < endMin) {
                    statusColor = '#ffc107';
                }
                list.push({
                    id: c.id,
                    name: c.name,
                    teacher: c.teacher || '', location: c.location || '',
                    
                    timeRange: c.startTime + ' - ' + c.endTime,
                    periodText: c.startPeriod + '-' + c.endPeriod + '\u8282',
                    color: COURSE_COLORS[c.colorIndex || 0],
                    statusColor: statusColor
                });
            }
            /* \u810f\u68c0\u67e5\uff1a\u540c\u4e00\u5929\u91cd\u590d onShow \u4e0d\u91cd\u5efa\u5217\u8868\uff08\u6027\u80fd\u4f18\u5316 2026-10-10\uff09 */
            crownFocus(self);
            var key = self.selectedDay + ':' + JSON.stringify(list);
            if (self._dayKey === key) { return; }
            self._dayKey = key;
            self.dayCourses = list;
            self.isEmpty = list.length === 0;
        });
    },
    onSyncClick: function () {
        router.push({ uri: 'pages/phone-sync/phone-sync' });
    },
    onCourseClick: function (courseId) {
        var self=this,gen=this._loadGen;if (!courseId||self.dead) return;
        storage.set({
            key: 'nav_courseId',
            value: courseId,
            success: function () {
                if(self.dead||gen!==self._loadGen)return;
                storage.set({
                    key: 'nav_source',
                    value: 'week',
                    success: function () {
                        if(self.dead||gen!==self._loadGen)return;
                        router.push({ uri: 'pages/detail/detail' });
                    }
                });
            }
        });
    },
    onBack: function () {
        router.push({ uri: 'pages/index/index' });
    }
};