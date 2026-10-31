import router from '../../common/router.js';
import data from '../../common/data.js';
import storage from '@system.storage';
import { DAY_NAMES, COURSE_COLORS, WEEK_TYPES } from '../../common/constants.js';
import ui from '../../common/watchUi.js';

export default {
    data: {
        ready:false,layoutError:'',w:0,h:0,top:0,bottom:0,paneW:0,headerH:0,bodyH:0,footerH:0,
        titleSize:18,textSize:14,smallSize:13,detailRowH:0,labelW:0,valueW:0,buttonW:0,buttonH:0,
        gap:0,dialogW:0,dialogH:0,dialogTitleH:0,dialogButtonW:0,location:'',saveError:'',
        detailRows: [],
        courseId: '',
        courseName: '',
        
        teacher: '',
        dayName: '',
        timeRange: '',
        periodText: '',
        weekTypeText: '',
        color: '',
        showDeleteConfirm: false,
        source: 'main'
    },
    onInit: function () {
        this.dead=false;ui.init(this,'detail');
        this.readNavData();
    },
    onShow: function () {
        this.dead=false;ui.init(this,'detail');data.clearCache();this._courseLoaded=false;
        this.readNavData();
    },
    onHide: function () {this.dead=true;this._uiGen++;this._readGen=(this._readGen||0)+1;},
    onDestroy: function () {this.onHide();data.clearCache();},
    readNavData: function () {
        var self=this,gen=(this._readGen||0)+1;this._readGen=gen;
        storage.get({
            key: 'nav_courseId',
            default: '',
            success: function (cid) {
                if(self.dead||gen!==self._readGen)return;
                storage.get({
                    key: 'nav_source',
                    default: 'main',
                    success: function (src) {
                        if(self.dead||gen!==self._readGen)return;
                        self.source = src;
                        if (cid) {
                            /* \u810f\u68c0\u67e5\uff1aonInit+onShow \u8fde\u8bfb\u4e24\u6b21\uff0c\u540c id \u8df3\u8fc7\u7b2c\u4e8c\u6b21
                             * \u5168\u91cf\u52a0\u8f7d\u6e32\u67d3\uff08\u6027\u80fd\u4f18\u5316 2026-10-10\uff09 */
                            if (self.courseId === cid && self._courseLoaded) { return; }
                            self.courseId = cid;
                            self._courseLoaded = true;
                            self.loadCourse();
                        }
                    }
                });
            }
        });
    },
    loadCourse: function () {
        if (!this.courseId) return;
        var page=this,gen=this._readGen;
        data.findCourse(page.courseId, function (course) {
            if (page.dead || gen!==page._readGen || !course) return;
            page.courseName = course.name;
            page.location = course.location || '-';
            
            page.teacher = course.teacher || '-';
            page.dayName = DAY_NAMES[course.dayOfWeek];
            page.timeRange = course.startTime + '-' + course.endTime;
            page.periodText = course.startPeriod + '-' + course.endPeriod + '\u8282';
            var wt = '\u5168\u90e8';
            for (var i = 0; i < WEEK_TYPES.length; i++) {
                if (WEEK_TYPES[i].value === course.weekType) {
                    wt = WEEK_TYPES[i].label;
                    break;
                }
            }
            page.weekTypeText = wt;
            page.color = COURSE_COLORS[course.colorIndex || 0];
            page.detailRows = [{label:'\u661f\u671f',value:page.dayName},{label:'\u65f6\u95f4',value:page.timeRange},
                {label:'\u8282\u6b21',value:page.periodText},{label:'\u6559\u5e08',value:page.teacher},
                {label:'\u5730\u70b9',value:page.location},{label:'\u5468\u6b21',value:page.weekTypeText}];
        });
    },
    onDelete: function () {
        this.showDeleteConfirm = true;
    },
    onConfirmDelete: function () {
        var page=this,gen=this._readGen;if(page.dead||page._deleting)return;page._deleting=true;
        data.deleteCourse(page.courseId, function (success) {
            page._deleting=false;
            if(page.dead||gen!==page._readGen)return;
            if (success) {
                if (page.source === 'week') {
                    router.push({ uri: 'pages/week/week' });
                } else {
                    router.push({ uri: 'pages/index/index' });
                }
            } else {page.showDeleteConfirm=false;page.saveError='\u5220\u9664\u5931\u8d25\uff0c\u539f\u8bfe\u8868\u4fdd\u7559';}
        });
    },
    onCancelDelete: function () {
        this.showDeleteConfirm = false;
    },
    onBack: function () {
        if (this.source === 'week') {
            router.push({ uri: 'pages/week/week' });
        } else {
            router.push({ uri: 'pages/index/index' });
        }
    },
    onSwipe: function (e) {
        if (e.direction === 'right' && e.distance >= 150) {
            this.onBack();
        }
    }
};