# 课表数据格式规范（schedule.json v1）

> 这份格式是**为同步而设计**的：手机端、手表端、将来的云中转，三方读写同一份文档。
> 手表侧唯一权威文件：`internal://app/schedule.json`

## 一、文件与顶层字段

```json
{
  "schema": "elcton.schedule",
  "version": 1,
  "rev": 12,
  "updatedAt": 1791502260000,
  "settings": {
    "semesterStart": "2026-09-01",
    "currentWeek": 1,
    "vibrationEnabled": true,
    "reminderMinutes": 5
  },
  "courses": [ ]
}
```

| 字段 | 类型 | 含义 |
|---|---|---|
| `schema` | string | 恒为 `elcton.schedule`，用来识别「这是课表文档」；不匹配按损坏处理 |
| `version` | int | **格式版本**。当前 `1`。新增字段=同版本；结构变更必须升版本 |
| `rev` | int | **修订号，落盘一次 +1**。同步冲突判定的第一依据（大者胜） |
| `updatedAt` | int | 最后落盘时间，epoch 毫秒。`rev` 相同时的第二依据 |
| `settings` | object | 学期起始周等设置，见下 |
| `courses` | array | 课程数组，每项见下 |

## 二、课程对象

```json
{
  "id": "c_d1",
  "name": "高等数学",
  "location": "A301",
  "teacher": "王教授",
  "dayOfWeek": 1,
  "startPeriod": 1,
  "endPeriod": 2,
  "startTime": "08:00",
  "endTime": "09:40",
  "weekType": "all",
  "weeks": [],
  "colorIndex": 0
}
```

| 字段 | 类型 | 约束 |
|---|---|---|
| `id` | string | **全局唯一、跨端稳定**，条目级合并的键。生成后不再改变 |
| `name` / `location` / `teacher` | string | 可空串，不为 null |
| `dayOfWeek` | int | 1=周一 … 7=周日 |
| `startPeriod` / `endPeriod` | int | 节次，`endPeriod >= startPeriod` |
| `startTime` / `endTime` | string | `HH:mm`，24 小时制 |
| `weekType` | string | `all` / `odd`（单周）/ `even`（双周） |
| `weeks` | int[] | `weekType` 为自定义时的具体周列表，否则 `[]` |
| `colorIndex` | int | 0–7 调色板下标 |

读入时一律走归一化：字段缺失补默认值、类型纠正、`id` 缺失的条目**直接丢弃**（不可识别的数据不入内存）。

## 三、确定性序列化（diff / 哈希友好）

写盘前做两件事，保证**同样内容必得同样字节**：

1. `courses` 按 `dayOfWeek → startPeriod → startTime → id` 升序排序
2. 对象按固定字段顺序输出（见上面两段 JSON 的字段次序），无值字段写空串/空数组，不省略

因此可以直接对整份文档做哈希比对，判断「有没有变」而不必逐条比较。

## 四、同步规则（给同步功能的约定）

1. **整文档为单位**：课表全文 <10KB，一次取全文，不做增量 patch
2. **冲突判定**：比 `rev`，大者胜；`rev` 相同比 `updatedAt`，大者胜；仍相同视为内容一致
3. **本地每次变更必须** `rev+1` 且刷新 `updatedAt`（`store.persist()` 已强制）
4. **条目级身份**：合并/去重用 `id`，**不要用课程名**（重名课很常见）
5. **版本保护**：拿到的文档 `version` 比本地新时**禁止降级覆盖**——先升级本地读写逻辑再写回。
   当前手表实现读到更高版本会按 v1 归一化，因此同步层必须在写回前挡这一下
6. **损坏不丢数据**：`schedule.json` 解析失败时，原文先备份到 `internal://app/schedule.bad.json` 再重建种子，
   远端也应保留上一份好数据以便回捞

## 五、落地位置

| 东西 | 位置 |
|---|---|
| 读写与归一化 | `common/store.js`（序列化、rev、写队列） |
| 分块读写 IO | `common/fs.js`（>4096B 必须串行分块，真机实测） |
| 数据层 API | `common/data.js`（对外签名与改造前一致；新增 `getDoc`/`replaceDoc` 给同步用） |
| 种子数据 | `resources/rawfile/seed-schedule.json`（**随包资产**，格式与本文档完全一致，23 门 demo） |
| 格式自测 | `scripts/test-persistence.mjs`（用 lite-sim 的模块加载器跑真实源码） |

### 为什么种子放 rawfile 而不是 JS 常量

Lite 每个页面是独立 bundle，课程字面量会**每页重复打包**：实测把 23 门课写进 JS
会把 week 页顶到 48KB 红线的 97%（错误码 34 = 装表时现场编译失败）。
放进 `rawfile/` 资产后只有一份、不占 JS 体积，现在 week 页估算 68%。

## 六、历史包袱（已修）

改造前（2026-10-09 之前）课程**只存在内存**：`saveCourses()` 只写模块缓存，
而 Lite 每个页面是独立 bundle、各有一份缓存 → 表现为「别的页看不到改动」「重启就还原成 demo」。
现已全部走 `schedule.json`，两个表现同时消失。
