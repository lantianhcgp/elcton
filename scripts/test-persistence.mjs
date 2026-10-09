// 课表持久化自测 —— 用 lite-sim 的模块加载器跑**真实源码**（不是副本）
// 覆盖：种子落盘 → 改动持久 → 跨「页面重启」回读 → 序列化格式 → 损坏保护 → 设置持久
//
// 运行（依赖同级目录的 lite-sim 仓库）：
//   node scripts/test-persistence.mjs
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const BASE = path.join(ROOT, "entry/src/main/js/MainAbility");
const SIM = path.resolve(HERE, "../../lite-sim");

const { ModuleLoader } = await import(path.join(SIM, "web/runtime/moduleloader.js"));
const { createSysMocks } = await import(path.join(SIM, "web/runtime/engine.js"));

// ---- 收集源码 ----
const files = {};
(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(hml|css|js)$/.test(f)) files[path.relative(BASE, p)] = fs.readFileSync(p, "utf8");
  }
})(BASE);

// 虚拟 IO 模块：测试里直接读写 mock 的文件系统
files["__test_io.js"] = `
import file from '@system.file';
export function writeRaw(uri, text, cb) {
  file.writeText({ uri: uri, text: text, success: function () { cb(null); }, fail: function (d, c) { cb(c); } });
}
export function readRaw(uri, cb) {
  file.get({
    uri: uri,
    success: function (meta) {
      var out = "", idx = 0, n = Math.ceil((meta.length || 0) / 4096);
      if (n === 0) { cb(null, ""); return; }
      (function step() {
        if (idx >= n) { cb(null, out); return; }
        file.readText({ uri: uri, position: idx * 4096, length: 4096,
          success: function (d) { out += (d && d.text) ? d.text : ""; idx++; step(); },
          fail: function (d, c) { cb(c); } });
      })();
    },
    fail: function (d, c) { cb(c); }
  });
}
`;

const reporter = {
  issues: [],
  push(r) { this.issues.push(r); return r; },
  batch: (a) => (a || []).forEach((r) => reporter.issues.push(r)),
  rule: (a) => (a || []).forEach((r) => reporter.issues.push(r)),
  exception: (e, c) => reporter.issues.push({ level: "error", code: "JS_" + (e && e.name), title: String(e && e.message), ctx: c }),
  event() {}, api() {}, dataChange() { return null; }, lifecycle() {},
  counts: { error: 0, warn: 0, info: 0 },
  stats() { return { total: reporter.issues.length }; },
};

const mocks = createSysMocks(reporter);

// 把随包种子灌进 mock 文件系统（真机上它由 hvigor 打进 rawfile，页面运行时可读）
const SEED_REL = "entry/src/main/resources/rawfile/seed-schedule.json";
const seedText = fs.readFileSync(path.join(ROOT, SEED_REL), "utf8");
await new Promise((res) => {
  const f = mocks.file;
  f.writeText({ uri: "internal://app/rawfile/seed-schedule.json", text: seedText, success: res, fail: res });
});
const loader = new ModuleLoader(files, { reporter, mocks, project: "elcton-repo" });

const data = loader.loadEntry("common/data.js");
const io = loader.load("__test_io.js");
const URI = "internal://app/schedule.json";
const BAD = "internal://app/schedule.bad.json";

const wait = (ms = 15) => new Promise((r) => setTimeout(r, ms));
const asPromise = (fn, ...args) => new Promise((res) => fn(...args, (v) => res(v)));

let pass = 0, fail = 0;
function check(name, cond, extra = "") {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
}

console.log("== 1) 首次加载：种子落盘 ==");
let courses = await asPromise((cb) => data.loadCourses(cb));
check("默认 23 门", courses.length === 23, `实际 ${courses.length}`);
await wait();
let raw = await new Promise((res) => io.readRaw(URI, (e, t) => res(t)));
let doc = JSON.parse(raw);
check("schema 正确", doc.schema === "elcton.schedule", doc.schema);
check("version=1", doc.version === 1, doc.version);
check("rev 已生成 (>=1)", doc.rev >= 1, String(doc.rev));
check("updatedAt 是毫秒时间戳", typeof doc.updatedAt === "number" && doc.updatedAt > 1e12, String(doc.updatedAt));
check("courses 已写入", Array.isArray(doc.courses) && doc.courses.length === 23, String(doc.courses && doc.courses.length));
check("settings 已写入", doc.settings && doc.settings.semesterStart === "2026-09-01", JSON.stringify(doc.settings));

console.log("== 2) 新增课程 → 重启（清缓存）后仍存在 ==");
const before = doc.rev;
const okAdd = await asPromise((cb) => data.addCourse({
  id: "c_test_99", name: "真实课表测试", location: "Z999", teacher: "测试老师",
  dayOfWeek: 2, startPeriod: 7, endPeriod: 8, startTime: "16:00", endTime: "17:40",
  weekType: "all", weeks: [], colorIndex: 3
}, cb));
check("addCourse 回调成功", okAdd === true, String(okAdd));
data.clearCache();                       // 模拟退出页面 / 重启 app
courses = await asPromise((cb) => data.loadCourses(cb));
check("重启后新课还在", courses.some((c) => c.id === "c_test_99"), `共 ${courses.length} 门`);
raw = await new Promise((res) => io.readRaw(URI, (e, t) => res(t)));
doc = JSON.parse(raw);
check("落盘含新课", doc.courses.some((c) => c.id === "c_test_99"));
check("rev 递增", doc.rev === before + 1, `${before} → ${doc.rev}`);

console.log("== 3) 确定性序列化（同内容同字节）==");
const store = loader.loadEntry("common/store.js");
const s1 = store.serialize(doc);
const shuffled = JSON.parse(JSON.stringify(doc));
shuffled.courses.reverse();              // 打乱顺序后序列化，应与原字节一致
const s2 = store.serialize(shuffled);
check("课程顺序不影响字节", s1 === s2, `${s1.length} vs ${s2.length}`);
check("字段顺序固定", s1.indexOf('"schema"') < s1.indexOf('"version"') && s1.indexOf('"version"') < s1.indexOf('"rev"'));

console.log("== 4) 删除课程 → 重启后消失 ==");
const okDel = await asPromise((cb) => data.deleteCourse("c_test_99", cb));
check("deleteCourse 回调成功", okDel === true, String(okDel));
data.clearCache();
courses = await asPromise((cb) => data.loadCourses(cb));
check("重启后已删除", !courses.some((c) => c.id === "c_test_99"), `剩 ${courses.length} 门`);

console.log("== 5) 设置持久 ==");
const st = { semesterStart: "2026-09-07", currentWeek: 5, vibrationEnabled: false, reminderMinutes: 10 };
const okSet = await asPromise((cb) => data.saveSettings(st, cb));
check("saveSettings 成功", okSet === true, String(okSet));
data.clearCache();
let settings = await asPromise((cb) => data.loadSettings(cb));
check("重启后设置一致", JSON.stringify(settings) === JSON.stringify(st), JSON.stringify(settings));

console.log("== 6) 损坏保护：坏文件备份 + 重建种子 ==");
await new Promise((res) => io.writeRaw(URI, "{ 这不是 JSON", res));
data.clearCache();
courses = await asPromise((cb) => data.loadCourses(cb));
check("损坏后仍可用（回到种子）", courses.length === 23, `实际 ${courses.length}`);
const bad = await new Promise((res) => io.readRaw(BAD, (e, t) => res(e ? null : t)));
check("坏原文已备份", bad === "{ 这不是 JSON", String(bad).slice(0, 30));

console.log("== 7) 并发读共享一次 IO ==");
data.clearCache();
const [a, b, c] = await Promise.all([
  asPromise((cb) => data.loadCourses(cb)),
  asPromise((cb) => data.loadCourses(cb)),
  asPromise((cb) => data.loadSettings(cb)),
]);
check("并发调用都拿到数据", a.length > 0 && b.length > 0 && !!c.semesterStart);

console.log("\n" + `结果: ${pass} 通过 / ${fail} 失败`);
if (reporter.issues.length) {
  console.log("报告器捕获的问题:");
  for (const i of reporter.issues) console.log("  ", i.code, i.title);
}
process.exit(fail ? 1 : 0);
