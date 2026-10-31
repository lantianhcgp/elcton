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
        this.enableRotation('courseList', false);
    },
    onDestroy: function () {
        this.dead = true; this._uiGen++;
        this.enableRotation('courseList', false);
        data.clearCache();
    },
    enableRotation: function (ref, value) {
        var r = this.$refs[ref];
        if (r && r.rotation) {
            r.rotation({ focus: value });
        }
    },
    loadData: function () {
        var self = this;
        var day = utils.getDayOfWeek();
        self.dayName = DAY_NAMES[day];
        data.loadSettings(function (settings) {
            if (self.dead) { return; }
            self.loadError = settings.__loadError || '';
            var week = utils.calculateCurrentWeek(settings.semesterStart);
            self.weekDisplay = utils.getDateString() + ' \u7b2c' + week + '\u5468';
            data.getCoursesForDay(day, week, function (courses) {
                if (self.dead) { return; }
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
                /* 脏检查：onInit+onShow 会连调两次，数据没变跳过整体重建，
                 * 避免 Lite 上的重复列表渲染（性能优化 2026-10-10） */
                var key = JSON.stringify(list);
                if (self._listKey === key) { return; }
                self._listKey = key;
                self.todayCourses = list;
                self.isEmpty = list.length === 0;
                /* 上课中滚到当前课；没在上课滚到下一节要上的课（用户需求
                 * 2026-10-10）；全部上完则不滚 */
                var target = currentIdx >= 0 ? currentIdx : nextIdx;
                if (target > 0) {
                    setTimeout(function () {
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
        storage.set({
            key: 'nav_courseId',
            value: courseId,
            success: function () {
                storage.set({
                    key: 'nav_source',
                    value: 'main',
                    success: function () {
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