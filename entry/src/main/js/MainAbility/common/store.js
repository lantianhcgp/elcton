/* 课表文档持久化 —— 单一权威文件 internal://app/schedule.json
 *
 * 格式规范：docs/schedule-format.md（schema/version/rev/updatedAt 为同步而设）
 * 要点：
 * - 整文档读写，课表体量 <10KB，不做增量
 * - 每次落盘 rev+1、updatedAt=Date.now()，同步侧用「rev 大者胜」解决冲突
 * - 序列化按固定字段顺序 + 确定性排序 → 同样内容必得同样字节，方便 diff/哈希
 * - 首次安装：从 rawfile/seed-schedule.json（随包种子，与本文档同格式）灌入
 * - 文件损坏时不丢数据：原文先备份到 schedule.bad.json，再重新灌种子
 *
 * 注意：种子放在 rawfile 资产里而不是 JS 常量里 —— 每页是独立 bundle，
 * 23 门课的字面量进 JS 会把页面体积顶到 48KB 红线（实测估算 97%，已规避）
 */
import fs from './fs.js';
import createJournal from './wearJournal.js';
import protocol from './wearProtocol.js';

var journal = createJournal({read: fs.readFile, write: fs.writeFile});

var URI = 'internal://app/schedule.json';
var BAD_URI = 'internal://app/schedule.bad.json';
var SEED_URI = 'internal://app/rawfile/seed-schedule.json';
var SCHEMA = 'elcton.schedule';
var VERSION = 1;

/* ── 归一化：读进来的任何对象都过一遍，字段缺省补齐、类型纠正 ── */
function num(v, d) { var n = Number(v); return isNaN(n) ? d : n; }
function str(v) { return (v === undefined || v === null) ? '' : String(v); }
function stripBom(s) { s = String(s); return s.charCodeAt(0) === 0xFEFF ? s.substring(1) : s; }
function isArray(v) { return Object.prototype.toString.call(v) === '[object Array]'; }

function normSettings(s) {
    s = s || {};
    return {
        semesterStart: str(s.semesterStart) || '2026-09-01',
        currentWeek: num(s.currentWeek, 1),
        vibrationEnabled: s.vibrationEnabled === undefined ? true : !!s.vibrationEnabled,
        reminderMinutes: num(s.reminderMinutes, 5)
    };
}

function normCourse(c) {
    if (!c || typeof c !== 'object' || !c.id) { return null; }
    var weeks = [];
    if (isArray(c.weeks)) {
        for (var i = 0; i < c.weeks.length; i++) { weeks.push(num(c.weeks[i], 0)); }
    }
    return {
        id: str(c.id),
        name: str(c.name),
        location: str(c.location),
        teacher: str(c.teacher),
        dayOfWeek: num(c.dayOfWeek, 1),
        startPeriod: num(c.startPeriod, 1),
        endPeriod: num(c.endPeriod, 1),
        startTime: str(c.startTime),
        endTime: str(c.endTime),
        weekType: str(c.weekType) || 'all',
        weeks: weeks,
        colorIndex: num(c.colorIndex, 0)
    };
}

function normCourses(list) {
    var out = [];
    if (!isArray(list)) { return out; }
    for (var i = 0; i < list.length; i++) {
        var c = normCourse(list[i]);
        if (c) { out.push(c); }
    }
    return out;
}

/* 解析任意 JSON 文本 → 合法文档；不认识/损坏返回 null */
function parseDoc(text) {
    var p = null;
    try { p = JSON.parse(stripBom(text)); } catch (e) { return null; }
    if (!p || typeof p !== 'object' || p.schema !== SCHEMA || p.version !== VERSION ||
        !isArray(p.courses) || p.courses.length > 200 || String(text).length > 32768) { return null; }
    try { protocol.snapshot(p); } catch (e) { return null; }
    return {
        schema: SCHEMA,
        version: num(p.version, VERSION),
        rev: num(p.rev, 1),
        updatedAt: num(p.updatedAt, 0),
        settings: normSettings(p.settings),
        courses: normCourses(p.courses)
    };
}

/* 兜底文档：连种子资产都读不到时用（空课表，设置仍可用） */
function newDoc() {
    return {
        schema: SCHEMA, version: VERSION, rev: 0, updatedAt: 0,
        settings: normSettings(null), courses: []
    };
}

/* ── 序列化：字段顺序固定、课程确定性排序 → 同内容同字节 ── */
function courseCmp(a, b) {
    if (a.dayOfWeek !== b.dayOfWeek) { return a.dayOfWeek - b.dayOfWeek; }
    if (a.startPeriod !== b.startPeriod) { return a.startPeriod - b.startPeriod; }
    if (a.startTime !== b.startTime) { return a.startTime < b.startTime ? -1 : (a.startTime > b.startTime ? 1 : 0); }
    return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
}

function courseJSON(c) {
    return {
        id: c.id, name: c.name, location: c.location, teacher: c.teacher,
        dayOfWeek: c.dayOfWeek, startPeriod: c.startPeriod, endPeriod: c.endPeriod,
        startTime: c.startTime, endTime: c.endTime, weekType: c.weekType,
        weeks: c.weeks, colorIndex: c.colorIndex
    };
}

function serialize(doc) {
    var courses = doc.courses.slice().sort(courseCmp);
    var out = {
        schema: SCHEMA,
        version: VERSION,
        rev: doc.rev,
        updatedAt: doc.updatedAt,
        settings: {
            semesterStart: doc.settings.semesterStart,
            currentWeek: doc.settings.currentWeek,
            vibrationEnabled: doc.settings.vibrationEnabled,
            reminderMinutes: doc.settings.reminderMinutes
        },
        courses: []
    };
    for (var i = 0; i < courses.length; i++) { out.courses.push(courseJSON(courses[i])); }
    return JSON.stringify(out);
}

/* ── 首次安装：读随包种子 → 落盘成正式文档 ── */
function migrate(doc, cb) {
    var text;
    try { text = protocol.snapshot(doc); } catch (e) { cb('INVALID_LOCAL_DOC');return; }
    var meta = {datasetId:'',sourceRevision:0,appliedDigest:'',localDirty:doc.courses.length > 0,
        localSettings:normSettings(doc.settings),updatedAt:doc.updatedAt || 0};
    journal.commit(text,meta,function(err,record) {
        if (err) { cb(err);return; }
        doc.rev=record.generation;doc.__generation=record.generation;cb(null,doc);
    },null,0);
}
function seed(cb) {
    fs.readFile(SEED_URI, function (code, text) {
        if (code && code !== 301) { cb(code);return; }
        var doc = code === 301 ? newDoc() : parseDoc(text);
        if (!doc) { cb('INVALID_SEED');return; }
        migrate(doc,cb);
    });
}

/* ── 读：不存在 → 灌种子；损坏 → 备份原文后重建 ── */
function loadLegacy(cb) {
    fs.readFile(URI, function (code, text) {
        if (code !== undefined && code !== null) {
            if (code === 301) { seed(cb); } else { cb(code); }
            return;
        }
        var doc = parseDoc(text);
        if (!doc) {
            fs.backup(BAD_URI, String(text), function (backupErr) { cb(backupErr || 'INVALID_LEGACY_DOC'); });
            return;
        }
        migrate(doc,cb);
    });
}
function loadOnce(cb) {
    journal.load(function (err, record) {
        if (err) { cb(err); return; }
        if (!record) { loadLegacy(cb); return; }
        var doc = parseDoc(record.text);
        if (!doc || doc.version !== VERSION) { cb('INVALID_COMMITTED_DOC'); return; }
        fs.readFile(URI, function (legacyErr, legacyText) {
            var legacy = !legacyErr ? parseDoc(legacyText) : null;
            var localSettings = record.meta.localSettings || (legacy && legacy.settings);
            if (localSettings) {
                doc.settings.vibrationEnabled = localSettings.vibrationEnabled;
                doc.settings.reminderMinutes = localSettings.reminderMinutes;
            }
            doc.rev = record.generation;
            doc.__generation = record.generation;
            doc.__sourceRevision = record.meta.sourceRevision || 0;
            doc.updatedAt = record.meta.updatedAt || 0;
            cb(undefined, doc);
        });
    });
}

/* Coalesce cross-page loads/migration; never open two first-generation commits. */
function load(cb) {
    var shared=fs.shared;
    if (!shared) { cb('APP_CONTEXT_UNAVAILABLE');return; }
    if (shared.storeLoad) {
        if (shared.storeLoad.length >= 12) { cb('LOAD_BUSY');return; }
        shared.storeLoad.push(cb);return;
    }
    shared.storeLoad=[cb];
    loadOnce(function(err,doc) {
        var waiters=shared.storeLoad;shared.storeLoad=null;
        for (var i=0;i<waiters.length;i++) { waiters[i](err,doc); }
    });
}
/* Bounded writers with generation-CAS; an old cached page cannot replace newer data. */
var wQueue = [];
var wBusy = false;

function pump() {
    if (wBusy) { return; }
    var item = wQueue.shift();
    if (!item) { return; }
    wBusy = true;
    function done(code) {
        wBusy = false;
        if (item.cb) { item.cb(code); }
        pump();
    }
    journal.load(function (loadErr, previous) {
        if (loadErr) { done(loadErr); return; }
        if (item.expected !== undefined && (previous ? previous.generation : 0) !== item.expected) { done('CONFLICT');return; }
        var text;
        try { text = protocol.snapshot(JSON.parse(item.text)); } catch (e) { done(e.message); return; }
        var meta = previous ? JSON.parse(JSON.stringify(previous.meta)) : {datasetId:'',sourceRevision:0,appliedDigest:''};
        meta.localDirty = protocol.crc32(text) !== meta.appliedDigest;
        meta.localSettings = item.settings;
        meta.updatedAt = new Date().getTime();
        journal.commit(text, meta, function (err,result) {
            if (!err) { item.doc.rev=result.generation;item.doc.__generation=result.generation;item.doc.updatedAt=meta.updatedAt; }
            done(err);
        },null,item.expected);
    });
}

function persist(doc, cb) {
    if (wQueue.length >= 2) { if(cb)cb('WRITE_BUSY');return; }
    var text;
    try { text=serialize(doc);if(text.length>32768)throw new Error('SNAPSHOT_TOO_LARGE'); }
    catch(e) { if(cb)cb('INVALID_LOCAL_DOC');return; }
    wQueue.push({text:text,settings:normSettings(doc.settings),cb:cb,doc:doc,expected:doc.__generation});
    pump();
}

export default {
    URI: URI,
    BAD_URI: BAD_URI,
    SEED_URI: SEED_URI,
    SCHEMA: SCHEMA,
    VERSION: VERSION,
    newDoc: newDoc,
    parseDoc: parseDoc,
    serialize: serialize,
    load: load,
    persist: persist
};
