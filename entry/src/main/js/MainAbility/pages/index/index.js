import router from '../../common/router.js';
import data from '../../common/data.js';
import storage from '@system.storage';
import utils from '../../common/utils.js';
import { DAY_NAMES, COURSE_COLORS } from '../../common/constants.js';
import ui from '../../common/watchUi.js';

export default {
    data: {
        ready: false, layoutError: '', w:0, h:0, top:0, bottom:0, paneW:0, headerH:0, bodyH:0, footerH:0,
        titleSize:18, textSize:14, smallSize:13, titleH:0, subtitleH:0, rowH:0, cardH:0, cardW:0,
        cardInnerW:0, cardNameH:0, cardMetaH:0, cardTimeH:0, buttonW:0, buttonH:0, gap:0,
        dayName: '',
        weekDisplay: '',
        todayCourses: [],
        isEmpty: true
    },
    onInit: function () {
        this.dead = false; ui.init(this, 'index');
        this.loadData();
    },
    onShow: function () {
        this.dead = false; ui.init(this, 'index');
        data.clearCache();
        this.loadData();
        this.enableRotation('courseList', true);
    },
    onHide: function () {
        this.dead=true;this._uiGen++;this._loadGen=(this._loadGen||0)+1;
        if(this._scrollTimer){clearTimeout(this._scrollTimer);this._scrollTimer=null;}
        this.enableRotation('courseList', false);
    },
    onDestroy: function () {
        this.onHide();
        data.clearCache();
    },
    enableRotation: function (ref, value) {
        var r = this.$refs[ref];
        if (r && r.rotation) {
            r.rotation({ focus: value });
        }
    },
    loadData: function () {
        var self = this, gen=(this._loadGen||0)+1;this._loadGen=gen;
        var day = utils.getDayOfWeek();
        self.dayName = DAY_NAMES[day];
        data.loadSettings(function (settings) {
            if (self.dead || gen!==self._loadGen) { return; }
            self.loadError = settings.__loadError || '';
            var week = utils.calculateCurrentWeek(settings.semesterStart);
            self.weekDisplay = utils.getDateString() + ' \u7b2c' + week + '\u5468';
            data.getCoursesForDay(day, week, function (courses) {
                if (self.dead || gen!==self._loadGen) { return; }
                var list = [];
                var now = utils.getCurrentMinutes();
                var currentIdx = -1;
                var nextIdx = -1;
                for (var i = 0; i < courses.length; i++) {
                    var c = courses[i];
                    var startMin = utils.timeToMinutes(c.startTime);
                    var endMin = utils.timeToMinutes(c.endTime);
                    var statusColor = '#4caf50';
                    if (now >= endMin) {
                        statusColor = '#f44336';
                    } else if (now >= startMin) {
                        statusColor = '#ffc107';
                        currentIdx = i;
                    } else if (nextIdx < 0) {
                        nextIdx = i;
                    }
                    list.push({
                        id: c.id, name: c.name, teacher: c.teacher || '', location: c.location || '',
                        timeRange: c.startTime + ' - ' + c.endTime,
                        periodText: c.startPeriod + '-' + c.endPeriod + '\u8282',
                        statusColor: statusColor
                    });
                }
                /* \u810f\u68c0\u67e5\uff1aonInit+onShow \u4f1a\u8fde\u8c03\u4e24\u6b21\uff0c\u6570\u636e\u6ca1\u53d8\u8df3\u8fc7\u6574\u4f53\u91cd\u5efa\uff0c
                 * \u907f\u514d Lite \u4e0a\u7684\u91cd\u590d\u5217\u8868\u6e32\u67d3\uff08\u6027\u80fd\u4f18\u5316 2026-10-10\uff09 */
                var key = JSON.stringify(list);
                if (self._listKey === key) { return; }
                self._listKey = key;
                self.todayCourses = list;
                self.isEmpty = list.length === 0;
                /* \u4e0a\u8bfe\u4e2d\u6eda\u5230\u5f53\u524d\u8bfe\uff1b\u6ca1\u5728\u4e0a\u8bfe\u6eda\u5230\u4e0b\u4e00\u8282\u8981\u4e0a\u7684\u8bfe\uff08\u7528\u6237\u9700\u6c42
                 * 2026-10-10\uff09\uff1b\u5168\u90e8\u4e0a\u5b8c\u5219\u4e0d\u6eda */
                var target = currentIdx >= 0 ? currentIdx : nextIdx;
                if (target > 0) {
                    self._scrollTimer=setTimeout(function () {
                        if(self.dead||gen!==self._loadGen)return;
                        var listRef = self.$refs.courseList;
                        if (listRef && listRef.scrollTo) {
                            listRef.scrollTo({ index: target });
                        }
                    }, 32);
                }
            });
        });
    },
    onCourseClick: function (courseId) {
        var self=this,gen=this._loadGen;if(self.dead)return;
        storage.set({
            key: 'nav_courseId',
            value: courseId,
            success: function () {
                if(self.dead||gen!==self._loadGen)return;
                storage.set({
                    key: 'nav_source',
                    value: 'main',
                    success: function () {
                        if(self.dead||gen!==self._loadGen)return;
                        router.push({ uri: 'pages/detail/detail' });
                    }
                });
            }
        });
    },
    onWeekViewClick: function () {
        router.push({ uri: 'pages/week/week' });
    },
    onSyncClick: function () {
        router.push({ uri: 'pages/phone-sync/phone-sync' });
    },
    onSwipe: function (e) {
        if (e.direction === 'right' && e.distance >= 150) { router.back(); }
    }
};