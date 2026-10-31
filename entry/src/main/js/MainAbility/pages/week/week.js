import router from '../../common/router.js';
import data from '../../common/data.js';
import storage from '@system.storage';
import utils from '../../common/utils.js';
import { DAY_NAMES, DAY_NAMES_SHORT, COURSE_COLORS, PERIOD_TIMES } from '../../common/constants.js';
import ui from '../../common/watchUi.js';

export default {
    data: {
        ready:false, layoutError:'', w:0, h:0, top:0, bottom:0, paneW:0, headerH:0, bodyH:0, footerH:0,
        titleSize:18, textSize:14, smallSize:13, rowH:0, cardH:0, cardInnerW:0, cardNameH:0, cardMetaH:0,
        cardTimeH:0, tabsH:0, tabW:0, tabH:0, tabGap:3, listH:0, buttonW:0, buttonH:0, gap:0,
        /* data 初值必须是字面量：非字面量(IIFE/函数调用)在编译期会被丢掉，属性进不了 VM，
         * 之后再赋值也不触发重绘 —— 胶囊空文字的根因。真实值由 onInit 同步算出(同索引页日期)。 */
        currentWeek: 1,
        weekDisplay: '单',   /* 兜底非空，与 refreshLabel 首帧一致 */
        weekMode: 'auto',   /* auto=跟随当前周 | odd=单周课 | even=双周课 */
        selectedDay: 1,
        days: [{id:1,label:'\u4e00'},{id:2,label:'\u4e8c'},{id:3,label:'\u4e09'},{id:4,label:'\u56db'},{id:5,label:'\u4e94'},{id:6,label:'\u516d'},{id:7,label:'\u65e5'}],
        dayCourses: [],
        isEmpty: true
    },
    onInit: function () {
        this.dead=false; ui.init(this, 'week');
        this.selectedDay = utils.getDayOfWeek();
        /* 同步算一次（不等 IO 回调）：先按默认学期起始算，loadSettings 回调回来再按设置校正 */
        this.currentWeek = utils.calculateCurrentWeek('2026-09-01');
        this.refreshLabel();
        this.loadData();
    },
    onShow: function () {
        this.dead=false; ui.init(this, 'week');
        data.clearCache();
        this.loadData();
        this.enableRotation('courseList', true);
    },
    onHide: function () {
        this.enableRotation('courseList', false);
    },
    onDestroy: function () {
        this.dead=true; this._uiGen++; data.clearCache();
        this.enableRotation('courseList', false);
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
    /* 单双周切换按钮（2026-10-11 反馈）：点 header 右侧标签循环
     * 本周(自动) → 单周课 → 双周课 → 本周，标签始终标注当前显示的是单还是双 */
    onWeekModeClick: function () {
        var next = { auto: 'odd', odd: 'even', even: 'auto' };
        this.weekMode = next[this.weekMode] || 'auto';
        this.refreshLabel();
        this.loadDayCourses();
    },
    refreshLabel: function () {
        /* 只留「单/双」两字：加"第X周"整行会超出胶囊被截（用户真机截图实证） */
        var par = (this.currentWeek % 2 === 1) ? '单' : '双';
        if (this.weekMode === 'odd') { par = '单'; }
        if (this.weekMode === 'even') { par = '双'; }
        this.weekDisplay = par;
    },
    effectiveWeek: function () {
        if (this.weekMode === 'odd') { return 1; }    /* 奇数周代表（过滤只看奇偶） */
        if (this.weekMode === 'even') { return 2; }   /* 偶数周代表 */
        return this.currentWeek;
    },
    loadData: function () {
        var self = this;
        data.loadSettings(function (settings) {
            if (self.dead) { return; }
            self.currentWeek = utils.calculateCurrentWeek(settings.semesterStart);
            self.refreshLabel();
            self.loadDayCourses();
        });
    },
    loadDayCourses: function () {
        var self = this;
        data.getCoursesForDay(self.selectedDay, self.effectiveWeek(), function (courses) {
            if (self.dead) { return; }
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
            /* 脏检查：同一天重复 onShow 不重建列表（性能优化 2026-10-10） */
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
        if (!courseId) return;
        storage.set({
            key: 'nav_courseId',
            value: courseId,
            success: function () {
                storage.set({
                    key: 'nav_source',
                    value: 'week',
                    success: function () {
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