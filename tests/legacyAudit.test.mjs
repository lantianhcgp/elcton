import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loader} from './loadSource.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../entry/src/main/js/MainAbility');
const clone = value => JSON.parse(JSON.stringify(value));
const protocol = loader()('common/wearProtocol.js');
const course = (id = 'c1', extra = {}) => ({id, name:'Math', location:'R1', teacher:'T1',
    dayOfWeek:1, startPeriod:1, endPeriod:2, startTime:'08:00', endTime:'09:00',
    weekType:'all', weeks:[], colorIndex:0, ...extra});
const doc = (courses = [course()], extra = {}) => ({schema:'elcton.schedule', version:1,
    rev:2, updatedAt:10, settings:{semesterStart:'2026-09-01', currentWeek:1,
    vibrationEnabled:false, reminderMinutes:5}, courses, ...extra});
const slice = (courses = [course()], extra = {}) => ({...doc(courses), slice:true,
    page:0, pages:1, total:courses.length, ...extra});

function clock() {
    let now = 0, next = 1;
    const pending = new Map(), scheduled = [];
    return {
        pending, scheduled,
        setTimeout(fn, ms) {const id = next++; const item = {id, fn, at:now + ms, ms}; pending.set(id, item); scheduled.push(item); return id;},
        clearTimeout(id) {pending.delete(id);},
        tick(ms) {
            const end = now + ms;
            for (let steps = 0; steps < 1000; steps++) {
                const item = [...pending.values()].filter(v => v.at <= end).sort((a,b) => a.at-b.at || a.id-b.id)[0];
                if (!item) {now = end; return;}
                now = item.at; pending.delete(item.id); item.fn();
            }
            throw new Error('Unbounded test timer chain');
        },
        now() {return now;}
    };
}

function harness(name, options = {}) {
    const time = clock();
    const state = {doc:clone(options.local || doc([course()], {rev:1})), requests:[], writes:[],
        deletes:[], routes:[], reads:0, fileWrites:[], deviceReads:[], storageGets:[], storageSets:[], scrolls:[], rotations:[]};
    const data = {
        clearCache() {},
        getDoc(cb) {state.reads++; if (options.getDoc) options.getDoc(cb, state); else cb(clone(state.doc));},
        replaceDoc(next, cb) {state.writes.push(clone(next));
            const finish = ok => {if (ok) state.doc = clone(next); cb(ok);};
            if (options.replaceDoc) options.replaceDoc(next, finish, state); else finish(true);},
        loadSettings(cb) {if (options.loadSettings) options.loadSettings(cb, state); else cb(clone(state.doc.settings));},
        getCoursesForDay(day, week, cb) {if (options.getCoursesForDay) options.getCoursesForDay(day, week, cb, state); else cb(clone(state.doc.courses));},
        findCourse(id, cb) {if (options.findCourse) options.findCourse(id, cb, state); else cb(clone(state.doc.courses.find(c => c.id === id) || null));},
        deleteCourse(id, cb) {state.deletes.push(id); const finish = ok => {
            if (ok) state.doc.courses = state.doc.courses.filter(c => c.id !== id); cb(ok);};
            if (options.deleteCourse) options.deleteCourse(id, finish, state); else finish(true);}
    };
    const file = {
        readFile(uri, cb) {if (options.readFile) options.readFile(uri, cb, state); else cb(null, '123456');},
        writeFile(uri, value, cb) {state.fileWrites.push({uri, value}); if (options.writeFile) options.writeFile(uri, value, cb, state); else cb(null);}
    };
    const router = {push(v) {state.routes.push(v.uri);}, back() {state.routes.push('back');}};
    const device = {getInfo(p) {state.deviceReads.push(p); if (!options.deferDevice) p.success({windowWidth:412, windowHeight:484, screenShape:'rect'});}};
    const storage = {
        get(p) {state.storageGets.push(p); if (options.storageGet) options.storageGet(p, state); else p.success(p.key === 'nav_courseId' ? 'c1' : 'main');},
        set(p) {state.storageSets.push(p); if (options.storageSet) options.storageSet(p, state); else p.success();}
    };
    const ui = loader({device})('common/watchUi.js');
    const constants = {DAY_NAMES:['','Mon','Tue','Wed','Thu','Fri','Sat','Sun'], DAY_NAMES_SHORT:[],
        COURSE_COLORS:['red','orange','yellow','green','blue','purple','black','white'], PERIOD_TIMES:[],
        WEEK_TYPES:[{value:'all',label:'all'},{value:'odd',label:'odd'},{value:'even',label:'even'}]};
    const utils = {getDayOfWeek() {return 1;}, calculateCurrentWeek() {return 1;}, getDateString() {return '2026-11-01';},
        getCurrentMinutes() {return 500;}, timeToMinutes(v) {const [h,m] = v.split(':').map(Number); return h*60+m;}};
    const deps = {'../../common/data.js':data, '../../common/fs.js':file, '../../common/router.js':router,
        '../../common/watchUi.js':ui, '../../common/wearProtocol.js':protocol,
        '../../common/utils.js':utils, '../../common/constants.js':constants, '@system.storage':storage};
    const fetchApi = {fetch(p) {
        state.requests.push({url:p.url, method:p.method, at:time.now(), p});
        if (p.url.endsWith('health.txt')) {if (!options.holdHealth) p.success({code:200,data:'ok'}); return;}
        if (options.fetch) {options.fetch(p, state); return;}
        const next = options.responses && options.responses.shift();
        if (next === undefined) throw new Error('Unexpected fetch: ' + p.url);
        p.success({code:200, data:JSON.stringify(next)});
    }};
    let source = fs.readFileSync(path.join(root, 'pages', name, name + '.js'), 'utf8');
    source = source.replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?/g, (_, bindings, ref) =>
        bindings.split(',').map(v => {v=v.trim(); return 'var '+v+'=deps['+JSON.stringify(ref)+']['+JSON.stringify(v)+'];';}).join('\n'));
    source = source.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"];?/g, (_, binding, ref) =>
        'var '+binding+'=deps['+JSON.stringify(ref)+'];').replace('export default ', 'return ');
    const spec = Function('deps', 'setTimeout', 'clearTimeout', 'require', source)(deps,
        time.setTimeout, time.clearTimeout, module => {assert.equal(module, '@system.fetch'); return fetchApi;});
    const page = {...spec, ...clone(spec.data)}; delete page.data;
    page.$refs = {courseList:{rotation(v) {state.rotations.push(v.focus);}, scrollTo(v) {state.scrolls.push(v.index);}}};
    page.onInit();
    return {page, state, time, data, file};
}

function pull(responses, options = {}) {
    const h = harness('sync', {...options, responses:responses.map(clone)});
    h.page.onPull(); h.time.tick(3000); return h;
}
function hide(page, method = 'onHide') {
    assert.equal(typeof page[method], 'function', method + ' lifecycle hook is missing'); page[method]();
}

for (const [field, value] of Object.entries({teacher:'T2', location:'R2', startTime:'08:10', endTime:'09:10',
    colorIndex:1, name:'Physics', id:'c2', dayOfWeek:2, startPeriod:2, endPeriod:3, weekType:'odd'})) {
    test('shared projection detects course change: ' + field, () => {
        const h = pull([doc([course('c1', {[field]:value})])]);
        assert.equal(h.state.writes.length, 1, field + ' must not be classified as already current');
        assert.equal(h.state.writes[0].courses[0][field], value); h.page.onDestroy();
    });
}
test('shared projection includes semesterStart but excludes watch-only settings and revision', () => {
    const changed = doc(); changed.settings.semesterStart = '2026-09-02';
    const h = pull([changed]); assert.equal(h.state.writes.length, 1); h.page.onDestroy();
    const privateOnly = doc(); privateOnly.settings.reminderMinutes = 10;
    const same = pull([privateOnly]); assert.equal(same.state.writes.length, 0); same.page.onDestroy();
});
test('shared projection comparison is order-independent and delimiter-safe', () => {
    const same = pull([doc([course('b'),course('a')])], {local:doc([course('a'),course('b')], {rev:1})});
    assert.equal(same.state.writes.length, 0); same.page.onDestroy();
    const changed = pull([doc([course('x|A', {name:'B'})])], {local:doc([course('x',{name:'A|B'})], {rev:1})});
    assert.equal(changed.state.writes.length, 1); changed.page.onDestroy();
});

for (const [label, total] of [['missing',undefined], ['null',null], ['string','0'], ['negative',-1], ['fraction',0.5], ['over-limit',201], ['boolean',false]]) {
    test('slice rejects ' + label + ' total instead of importing an empty table', () => {
        const h = pull([slice([], {total})]); assert.equal(h.state.writes.length, 0); assert.equal(h.page.running, false); h.page.onDestroy();
    });
}
for (const [label, courses] of [['missing',undefined], ['null',null], ['object',{length:0}]]) {
    test('slice rejects ' + label + ' courses rather than silently treating it as empty', () => {
        const h = pull([slice([], {courses, total:0})]); assert.equal(h.state.writes.length, 0); h.page.onDestroy();
    });
}
for (const [label, pages] of [['missing',undefined], ['zero',0], ['fraction',1.5], ['string','1'], ['unbounded',201]]) {
    test('slice rejects ' + label + ' page count', () => {
        const h = pull([slice([], {pages, total:0})]); assert.equal(h.state.writes.length, 0); assert.equal(h.page.running, false); h.page.onDestroy();
    });
}
for (const [label, value] of [['old',0], ['missing',undefined], ['string','1'], ['future',2]]) {
    test('legacy import enforces strict v1 for ' + label + ' version', () => {
        const h = pull([doc([course('new')], {version:value})]); assert.equal(h.state.writes.length, 0); h.page.onDestroy();
    });
}
for (const invalid of [doc([course('new')], {settings:{semesterStart:'2026-02-30'}}),
    doc([course('new')], {courses:undefined}), doc([course('new'), {...course('bad'), id:''}]),
    doc([course('same'), course('same')]), doc([course('new', {weeks:[1]})])]) {
    test('legacy full import rejects invalid shared document: ' + JSON.stringify(invalid).slice(-90), () => {
        const h = pull([invalid]); assert.equal(h.state.writes.length, 0); h.page.onDestroy();
    });
}
test('slice rejects declared/final course-count mismatch and invalid courses without skipping', () => {
    for (const r of [slice([course('new')], {total:2}), slice([{...course('bad'),id:''}])]) {
        const h = pull([r]); assert.equal(h.state.writes.length, 0); assert.equal(h.page.running, false); h.page.onDestroy();
    }
});
test('slice rejects page index, total, pages or revision changing in transit', () => {
    const first = slice(Array.from({length:10}, (_,i) => course('c'+i)), {total:11,pages:2});
    for (const change of [{page:0}, {total:12}, {pages:3}, {rev:3}, {updatedAt:11}]) {
        const h = pull([first, slice([course('last')], {page:1,pages:2,total:11,...change})]);
        assert.equal(h.state.writes.length, 0, JSON.stringify(change)); h.page.onDestroy();
    }
});
test('slice chain cannot silently fall back to a full response after the first page', () => {
    const first = slice(Array.from({length:10}, (_,i) => course('c'+i)), {total:11,pages:2});
    const h = pull([first, doc([course('unexpected')])]); assert.equal(h.state.writes.length, 0); h.page.onDestroy();
});
test('valid pickup pagination preserves ten-course pages, 400ms intervals and delayed merge', () => {
    const courses = Array.from({length:21}, (_,i) => course('c'+i));
    const h = harness('sync', {responses:[slice(courses.slice(0,10), {pages:3,total:21}),
        slice(courses.slice(10,20), {page:1,pages:3,total:21}), slice(courses.slice(20), {page:2,pages:3,total:21})]});
    h.page.onPull(); assert.equal(h.state.writes.length, 0); h.time.tick(800);
    assert.equal(h.state.writes.length, 0); h.time.tick(100);
    assert.deepEqual(h.state.requests.filter(r => !r.url.endsWith('health.txt')).map(r => r.at), [0,400,800]);
    assert.equal(h.state.writes.length, 1); assert.equal(h.state.writes[0].courses.length, 21);
    assert.equal(protocol.snapshot(h.state.writes[0]), protocol.snapshot(doc(courses)));
    assert.equal(h.time.pending.size, 0); h.page.onDestroy();
});
test('explicit valid empty table can still replace the old table', () => {
    const h = pull([slice([], {total:0})]); assert.equal(h.state.writes.length, 1);
    assert.deepEqual(h.state.doc.courses, []); h.page.onDestroy();
});
test('no pickup code keeps the read-only legacy endpoint and wrapped full-document route', () => {
    const h = pull([{doc:doc([course('new')])}], {readFile(uri, cb) {cb(301, '');}});
    const request = h.state.requests.find(r => !r.url.endsWith('health.txt'));
    assert.equal(request.url, 'http://listenword.qingyun3.com/elcton/schedule.json');
    assert.equal(request.method, 'GET'); assert.equal(h.state.writes.length, 1); h.page.onDestroy();
});
test('local revision conflict retains the existing second-pull confirmation', () => {
    const remote = doc([course('changed')], {rev:1});
    const h = harness('sync', {responses:[clone(remote),clone(remote)]});
    h.page.onPull(); assert.equal(h.state.writes.length, 0); assert.equal(h.page.pendingForce, true);
    h.page.onPull(); assert.equal(h.state.writes.length, 1); h.page.onDestroy();
});

for (const method of ['onHide','onDestroy']) {
    test('sync ' + method + ' cancels both page-gap and delayed-merge timers and stale callbacks', () => {
        for (const response of [slice(Array.from({length:10}, (_,i) => course('c'+i)), {pages:2,total:11}), slice([course('new')])]) {
            const h = harness('sync', {responses:[response]}); h.page.onPull();
            const callbacks = [...h.time.pending.values()]; hide(h.page, method);
            assert.equal(h.time.pending.size, 0, 'every timer handle must be cancelled');
            const count = h.state.requests.length; for (const item of callbacks) item.fn();
            assert.equal(h.state.requests.length, count); assert.equal(h.state.writes.length, 0);
        }
    });
}
test('sync retry, health, code and refresh cannot supersede an in-flight commit', () => {
    let finish;
    const h = harness('sync', {responses:[doc([course('new')]),doc([course('other')])], replaceDoc(next, cb) {finish = cb;}});
    h.page.onPull(); const generation = h.page.gen, reads = h.state.reads, requests = h.state.requests.length;
    h.page.onRetry(); h.page.onRowClick(3); h.page.onRowClick(0); h.page.onRowClick(2); h.page.health(); h.page.onPull();
    assert.equal(h.page.gen, generation); assert.equal(h.page.running, true);
    assert.equal(h.state.reads, reads); assert.equal(h.state.requests.length, requests);
    assert.equal(h.state.writes.length, 1); assert.deepEqual(h.state.routes, []);
    finish(true); assert.equal(h.page.running, false); assert.equal(h.state.doc.courses[0].id, 'new'); h.page.onDestroy();
});
test('sync manual health cannot cancel a comparison read and start another pull', () => {
    let compare;
    const h = harness('sync', {responses:[doc([course('new')])], getDoc(cb, state) {if (state.reads > 1) compare = cb; else cb(clone(state.doc));}});
    h.page.onPull(); const generation = h.page.gen, requests = h.state.requests.length;
    h.page.onRowClick(3); h.page.onRowClick(0);
    assert.equal(h.page.gen, generation); assert.equal(h.state.requests.length, requests);
    compare(clone(h.state.doc)); assert.equal(h.state.writes.length, 1); h.page.onDestroy();
});
test('sync watchdog cannot unlock a pending write or permit duplicate replacement', () => {
    let finish;
    const h = harness('sync', {responses:[doc([course('new')]),doc([course('other')])], replaceDoc(next, cb) {finish = cb;}});
    h.page.onPull(); h.time.tick(15000); h.page.onPull();
    assert.equal(h.page.running, true); assert.equal(h.state.writes.length, 1);
    assert.doesNotMatch(h.page.detail, /old.*preserv|\u539f.*\u4fdd\u7559/i);
    finish(true); assert.equal(h.page.running, false); h.page.onDestroy();
});
test('leaving sync cancels UI callbacks but does not claim cancellation of an already started commit', () => {
    let finish;
    const h = harness('sync', {responses:[doc([course('new')])], replaceDoc(next, cb) {finish = cb;}});
    h.page.onPull(); h.page.onBack(); const detail = h.page.detail, rows = JSON.stringify(h.page.rows), reads = h.state.reads;
    finish(true); assert.equal(h.state.doc.courses[0].id, 'new');
    assert.equal(h.page.detail, detail); assert.equal(JSON.stringify(h.page.rows), rows);
    assert.equal(h.state.reads, reads); assert.equal(h.time.pending.size, 0);
});
test('sync physical commit settles the lock even when its old UI callback is discarded', () => {
 let finish;
 const h=harness('sync',{responses:[doc([course('new')])],replaceDoc(next,cb){finish=cb;}});
 h.page.onPull();hide(h.page);h.page.onShow();assert.equal(h.page.running,true);
 finish(true);assert.equal(h.page.running,false);assert.equal(h.page.committing,false);
 h.page.onRetry();assert.equal(h.page.dead,false);h.page.onDestroy();
});
test('sync late initial local-read callback cannot start health after destruction', () => {
    let read;
    const h = harness('sync', {getDoc(cb) {read = cb;}}); h.page.onDestroy(); const detail = h.page.detail;
    read(doc()); assert.equal(h.state.requests.length, 0); assert.equal(h.page.detail, detail);
});
test('sync frozen health remains manually restartable without overlapping old callbacks', () => {
    const h = harness('sync', {holdHealth:true}); const old = h.state.requests[0].p;
    h.page.onRowClick(3); assert.equal(h.state.requests.length, 2);
    const detail = h.page.detail; old.success({code:200,data:'ok stale'}); assert.equal(h.page.detail, detail);
    h.state.requests[1].p.success({code:200,data:'ok new'}); assert.equal(h.page.running, false); h.page.onDestroy();
});

for (const name of ['index','week','detail','code','sync']) {
    for (const method of ['onHide','onDestroy']) {
        test(name + ' rejects late getInfo callbacks after ' + method, () => {
            const h = harness(name, {deferDevice:true}); hide(h.page, method);
            const before = JSON.stringify([h.page.ready,h.page.w,h.page.layoutError]);
            for (const p of h.state.deviceReads) {p.success({windowWidth:280,windowHeight:456,screenShape:'rect'}); p.fail();}
            assert.equal(JSON.stringify([h.page.ready,h.page.w,h.page.layoutError]), before);
        });
    }
}
for (const method of ['onHide','onDestroy']) {
    test('index cancels deferred scroll and ignores stale list callbacks on ' + method, () => {
        const h = harness('index', {local:doc([course('old',{startTime:'07:00',endTime:'07:30'}), course('next',{startTime:'08:30',endTime:'09:30'})])});
        const oldTimers = [...h.time.pending.values()]; hide(h.page, method);
        assert.equal(h.time.pending.size, 0); for (const timer of oldTimers) timer.fn();
        assert.deepEqual(h.state.scrolls, []);
    });
}
for (const name of ['index','week']) {
    test(name + ' rejects previous-show settings and courses after hide/show', () => {
        const reads = [];
        const h = harness(name, {getCoursesForDay(day, week, cb) {reads.push(cb);}});
        hide(h.page); h.page.onShow();
        reads[1]([course('fresh')]); reads[0]([course('stale')]);
        assert.equal((h.page.todayCourses || h.page.dayCourses)[0].id, 'fresh'); h.page.onDestroy();
    });
    test(name + ' cancels storage navigation callbacks after hiding', () => {
        const h = harness(name, {storageSet() {}}); h.page.onCourseClick('c1'); hide(h.page);
        h.state.storageSets[0].success(); assert.equal(h.state.storageSets.length, 1); assert.deepEqual(h.state.routes, []);
    });
}
test('week prevents late previous-day reads from rebuilding the newly selected day', () => {
    const reads = [];
    const h = harness('week', {getCoursesForDay(day, week, cb) {reads.push({day,cb});}});
    h.page.onDaySelect(2); reads[1].cb([course('tuesday',{dayOfWeek:2})]); reads[0].cb([course('monday')]);
    assert.equal(h.page.selectedDay, 2); assert.equal(h.page.dayCourses[0].id, 'tuesday'); h.page.onDestroy();
});
test('detail storage callbacks cannot load a dead page or overwrite a newer navigation target', () => {
    const h = harness('detail', {storageGet() {}}); const first = h.state.storageGets[0]; hide(h.page);
    first.success('c1'); assert.equal(h.state.storageGets.length, 1);
    h.page.onShow(); h.state.storageGets[1].success('c1'); h.state.storageGets[2].success('week');
    assert.equal(h.page.source, 'week'); h.page.onDestroy();
});
test('detail deletion double-click starts one callback-based removal and one navigation', () => {
    let finish;
    const h = harness('detail', {deleteCourse(id, cb) {finish = cb;}});
    h.page.onDelete(); h.page.onConfirmDelete(); h.page.onConfirmDelete(); assert.equal(h.state.deletes.length, 1);
    finish(true); assert.deepEqual(h.state.doc.courses, []); assert.deepEqual(h.state.routes, ['pages/index/index']); h.page.onDestroy();
});
test('detail deletion failure is retryable and cancelled UI ignores the actual eventual removal', () => {
    const finishes = [];
    const h = harness('detail', {deleteCourse(id, cb) {finishes.push(cb);}});
    h.page.onConfirmDelete(); finishes[0](false); assert.equal(h.state.routes.length, 0);
    h.page.onConfirmDelete(); assert.equal(h.state.deletes.length, 2); hide(h.page);
    const error = h.page.saveError; finishes[1](true); assert.deepEqual(h.state.doc.courses, []);
    assert.equal(h.page.saveError, error); assert.deepEqual(h.state.routes, []);
});
test('detail findCourse callback is ignored across hide/show generations', () => {
    const reads = [];
    const h = harness('detail', {findCourse(id, cb) {reads.push(cb);}}); hide(h.page); h.page.onShow();
    reads[1](course('c1',{name:'fresh'})); reads[0](course('c1',{name:'stale'}));
    assert.equal(h.page.courseName, 'fresh'); h.page.onDestroy();
});
test('code initial file read cannot overwrite digits already entered by the user', () => {
    let read;
    const h = harness('code', {readFile(uri, cb) {read = cb;}});
    for (let i = 0; i < 6; i++) h.page.onKey(i);
    read(null, '654321'); assert.equal(h.page.value, '123456'); h.page.onDestroy();
});
test('code double save locks the exact six-digit snapshot and ignores callbacks after cancel', () => {
    const callbacks = [];
    const h = harness('code', {writeFile(uri, value, cb) {callbacks.push(cb);}});
    h.page.onOk(); h.page.onOk(); h.page.onKey(9);
    assert.equal(h.state.fileWrites.length, 1); assert.equal(h.state.fileWrites[0].value, '123456'); assert.equal(h.page.value, '123456');
    h.page.onCancel(); const hint = h.page.hint; callbacks[0](null);
    assert.deepEqual(h.state.routes, ['pages/sync/sync']); assert.equal(h.page.hint, hint);
});
test('code save failure permits retry while stale duplicate completion cannot navigate', () => {
    const callbacks = [];
    const h = harness('code', {writeFile(uri, value, cb) {callbacks.push(cb);}});
    h.page.onOk(); callbacks[0](300); h.page.onOk(); callbacks[0](null);
    assert.equal(h.state.fileWrites.length, 2); assert.deepEqual(h.state.routes, []);
    callbacks[1](null); assert.deepEqual(h.state.routes, ['pages/sync/sync']); h.page.onDestroy();
});
test('code pending write remains locked across hide/show until its physical callback drains', () => {
    let finish;
    const h = harness('code', {writeFile(uri, value, cb) {finish = cb;}});
    h.page.onOk(); hide(h.page); h.page.onShow(); h.page.onOk(); assert.equal(h.state.fileWrites.length, 1);
    const hint = h.page.hint; finish(null); assert.deepEqual(h.state.routes, []); assert.equal(h.page.hint, hint);
    h.page.onOk(); assert.equal(h.state.fileWrites.length, 2); h.page.onDestroy();
});
test('code rejects a malformed length-six value rather than writing it', () => {
    const h = harness('code'); h.page.value = 'abcdef'; h.page.onOk(); assert.equal(h.state.fileWrites.length, 0); h.page.onDestroy();
});
test('authorized watch JavaScript remains ASCII and contains no new Promise or browser DOM dependencies', () => {
    for (const name of ['sync','index','week','detail','code']) {
        const source = fs.readFileSync(path.join(root, 'pages', name, name + '.js'), 'utf8');
        assert.doesNotMatch(source, /[^\x00-\x7f]/, name + ' must use Unicode escapes');
        const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
        assert.doesNotMatch(code, /\b(?:Promise|document|window|async|await)\b|=>|\?\.|\?\?/, name + ' must stay on the callback-based Lite path');
    }
});
