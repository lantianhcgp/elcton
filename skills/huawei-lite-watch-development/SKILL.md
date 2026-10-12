---
name: huawei-lite-watch-development
description: 规范华为 HarmonyOS Lite Wearable 轻智能手表应用的开发、修改、迁移、代码审查、性能优化和故障排查。用于包含 liteWearable、HML/CSS/JavaScript、JerryScript、common/rawfile、@system.file、@system.storage、@system.sensor 传感器、加速度计、陀螺仪、心率、计步、罗盘、气压计、佩戴状态、@system.vibrator、DevEco Studio 模拟器、@system.audio、64/256/512 KB JS heap、圆屏/方屏、图片内存池或旧版 API 兼容性的任务。Develop, review, migrate, optimize, or debug Huawei HarmonyOS Lite Wearable apps under strict HML, JavaScript, file, storage, sensor, vibration, memory, resource, audio, API-version, simulator, and real-device constraints.
---

# 华为轻智能手表开发规范

把 Lite Wearable 当作受严格内存和版本约束的独立平台。先确定设备档案，再选接口和实现；不得以桌面预览、编译成功或普通 Wearable 支持来代替 Lite Wearable 真机兼容性。

## 证据优先级

按以下顺序解决冲突，并在结论中注明依据：

1. 目标真机行为、固件、型号和已测日志。
2. 项目实际使用的 SDK 中的 `*.d.ts`、Lite 组件白名单和构建配置。
3. 用户提供或本机安装的官方接口资料与开发文档。
4. 同版本、同工程形态的可运行演示项目。
5. 推测或通用 HarmonyOS 经验。

不得因为接口在新 SDK 中存在就认定旧表可用。不得把 `Wearable` 支持等同于 `Lite Wearable` 支持。资料中带 `?` 的字段只能作为待验证信息。

## 工作流程

### 1. 建立目标设备档案

在写代码前明确并记录：型号/代号、圆屏或方屏、物理分辨率、适配分辨率、固件、最高 target、最高 compatible、运行时可查询的 API 版本、JS heap 档位、WearEngine 版本和所需硬件能力。

读取 [device-compatibility.md](references/device-compatibility.md)。如果用户未指定型号，默认按最差档处理：64 KB JS heap、旧版 API、圆屏安全区；同时把最终兼容范围标为“待真机确认”。不得擅自把 512 KB 当作全系列下限。

### 2. 识别工程形态

定位包含 `"liteWearable"` 的 `config.json`，确认源码通常位于：

```text
entry/src/main/config.json
entry/src/main/js/<Ability>/app.js
entry/src/main/js/<Ability>/pages/<page>/<page>.hml
entry/src/main/js/<Ability>/pages/<page>/<page>.css
entry/src/main/js/<Ability>/pages/<page>/<page>.js
```

只修改源码目录。忽略 `build/`、`.preview/`、`.hvigor/`、`node_modules/`、`oh_modules/` 等生成或依赖目录。不要把 ArkUI/ArkTS、Web DOM、Node.js API 或普通 Quick App 约定直接套到 Lite Wearable。

### 3. 放置和引用资源

完整读取 [resource-layout-and-paths.md](references/resource-layout-and-paths.md)。创建项目时 `common` 通常不存在，需要在 `entry/src/main/js/<Ability>/common` 手动创建。

把 HML/CSS 直接使用的固定图片放在 `common`，以 `/common/...` 绝对资源路径引用；公共 JS 使用相对 `import`。`common` 只在应用内部公共，对用户文件系统不可见，不能用 `@system.file` 枚举或读写。

所有打包图片必须使用英文 ASCII 文件名，推荐小写字母、数字、`_`、`-`；禁止中文、空格、全角符号、emoji 和其他非 ASCII 名称，否则真机可能无法识别或读取。`common`/`rawfile` 内图片子目录也使用英文 ASCII，且引用大小写与磁盘名称完全一致。

把必须经文件接口读取的原始数据、音频或特殊图片放在 `entry/src/main/resources/rawfile`，运行时以 `internal://app/rawfile/...` 访问。rawfile 按只读处理，需要修改或交给不支持 rawfile 直播的接口时先复制到 `internal://app/` 可写位置。不要把固定页面图片随意放 rawfile，也不要把 rawfile URI 写成 `/common/...`。

中文文案放置沿用已装成功工程的惯例（elcton 工程的 `.hml`/`.js` 内均无裸中文）：
`.hml` 静态文案用 `$t('strings.x')` + i18n JSON 放原文，或用 `&#x...;` 实体（elcton 风格）；
`.js` 动态串用 `\uXXXX` 转义（elcton 风格，写完可用脚本把非 ASCII 批量转义）；
只有 `i18n/*.json`、`string.json` 放裸中文。老 gradle 参考工程（Game2048 等）虽有裸中文，
但属不同构建链，不作本仓证据。

按已知实测，部分 DevEco Studio 5.0/API 10 预览器和 Lite Wearable 模拟器不能调用 `@system.file`。任何 file API、rawfile 图片、读取或复制流程都必须打包签名后上真机验证；模拟器成功或失败都不能代替该结论。其他工具链版本也要重新实测，不能继承结论。

### 4. 查询接口和组件

先搜索项目实际使用的 SDK，再查用户提供或可合法访问的官方资料：

```powershell
rg -n "接口名|@system\.模块名|@ohos\.模块名" "<DevEco-SDK>\default\openharmony\js\api"
rg -n "接口名|模块名" references
```

读取 [sdk-and-sources.md](references/sdk-and-sources.md) 选择资料。逐项确认 `since`、`deprecated`、`syscap`、权限、Lite Wearable 设备行为差异和订阅取消接口。优先保留目标设备已验证的 `@system.*` 接口；只有兼容矩阵与真机共同证明后，才迁移到 `@ohos.*` 或 `@kit.*`。

完整读取 [hml-lite-syntax.md](references/hml-lite-syntax.md)。只使用 SDK Lite 组件白名单中的原生标签、属性、事件和父子结构。遇到不确定项时直接查 `lite_component_map.js`、`component_validator.js` 与当前 SDK 规则，不能依据 HTML、Vue、JSX、ArkUI 或浏览器行为猜测。自定义标签只有在项目中找到真实组件定义和注册后才能放行。

需要官方组件细节时读取华为 [ArkUI JS 完整组件参考](https://developer.huawei.com/consumer/cn/doc/harmonyos-references/arkui-js-full-comp)，再用项目 SDK 的 Lite 白名单缩小范围。网页无法自动访问时，说明限制并使用本地 SDK；不得因“完整组件参考”中存在某标签就认定 Lite Wearable 支持。

涉及传感器、计步、心率、加速度、罗盘、气压、佩戴状态或陀螺仪时，完整读取 [sensors-on-lite-wearable.md](references/sensors-on-lite-wearable.md)。按接口逐项核对最低 API、权限、硬件和 Lite 无效果说明；每个订阅必须有同名取消路径，只能把目标真机数据作为支持证据。

涉及文件、rawfile 读写/复制、目录或键值持久化时，完整读取 [file-and-storage-on-lite-wearable.md](references/file-and-storage-on-lite-wearable.md)。保持回调顺序，不把 `@system.file` 当 Promise，不写删 rawfile，不用 storage 保存大值。

涉及振动时，完整读取 [vibrator-on-lite-wearable.md](references/vibrator-on-lite-wearable.md)。声明权限、限制触发频率，并在目标真机验证马达和系统策略。

### 5. 按 JerryScript 和低堆实现

完整读取 [jerryscript-syntax.md](references/jerryscript-syntax.md) 和 [memory-and-runtime.md](references/memory-and-runtime.md)。先区分 `.js` 源码、HML 表达式和最终构建产物：

- `.js` 源码允许开发文档明确列出的 ES6 子集：`let/const`、箭头函数、`class`、默认参数、解构赋值/绑定、增强对象初始化器、`for...of`、剩余参数、模板字符串和静态模块声明。不得把此清单扩张成完整 ES6/ES2017+ 支持。
- `.hml` 的 `{{...}}`、条件、属性绑定和事件参数明确不支持 ES6。保持为短小 ES5 表达式；复杂逻辑移入 `.js` 方法或预计算字段。
- 默认禁止文档未列入 Lite 子集的 `async/await`、生成器、展开语法、动态 `import()`、可选链、空值合并、类字段、BigInt，以及未经目标 SDK/真机证明的 Promise 和新内建对象。
- 文档允许的语法仍可能经构建链转译。对 64/256 KB heap、旧 SDK 或 helper 明显膨胀的路径，优先普通函数、显式参数检查和传统循环；不要为了风格强制把现有代码改成 ES5，也不要为了现代风格牺牲 heap。
- 不在表端嵌入 QuickJS、Babel、webpack、解释器、通用 polyfill 集或大型第三方运行库。除非用户明确要求实验，否则禁止 `eval` 和 `Function` 动态执行路径。
- 不把完整数据集、大型 JSON、字典、关卡、文章或图片元数据长期放在页面 `data` 或模块顶层。按页、按块、按当前场景从文件/存储读取。
- 为数组、缓存、历史、队列、日志和存档数量设置上限。优先循环和原地更新，避免连续 `map/filter/reduce`、对象扩展和短生命周期大对象。
- 将临时字符串、解析结果、回调闭包和重复副本计入 JS heap 风险。读取大文本时要分片或拆文件；`JSON.parse` 会同时产生源字符串与对象树，必须预留峰值。
- 在 `onDestroy` 中清除所有定时器、动画、订阅、传感器监听、媒体对象和大引用。页面隐藏后仍运行的任务也要停止或证明必要。
- 订阅类接口必须有一一对应的取消路径。传感器默认使用最低可接受频率，不能为了 UI 每帧刷新而使用 `game` 频率。

### 6. 实现音频

任何涉及音乐、音效、音量、播放列表或 `@system.audio` 的任务，必须完整读取 [audio-on-lite-wearable.md](references/audio-on-lite-wearable.md)。若用户拥有 `shalu2` 或其他已在同型号真机运行的音频工程，优先检查其源码与构建产物；仓库不附带第三方案例源码。

不得直接播放 `internal://app/rawfile/audio/...`。按 `shalu2` 方案将 `resources/rawfile/audio` 中的音乐、`playList` 和 `cur_playlist` 首次复制到 `internal://app/`，等待全部复制成功后再标记完成并播放 `internal://app/music/*.mp3`。使用 `@system.audio` 时配置 `ohos.permission.MODIFY_AUDIO_SETTINGS`，音量限制为 `0.0` 到 `1.0`，切换音源前停止当前播放，在页面和应用销毁路径停止音频并清除恢复定时器。

把 `@system.audio` 按单活动音源设计：背景音乐与音效切换时停止 BGM、播放音效、按已知时长恢复 BGM；未真机证明前不得假设可以多音轨混音。`rawfile/audio/get.js` 是电脑端 Node 生成工具，绝不能在 JerryScript 表端导入或执行。

### 7. 管理图片池

把图片池与 JS heap 分开评估，但两者都必须受控。图片池容量“十几 MB”来自用户经验，只能作为近似量，不得写成设备保证。

- 以解码尺寸估算：`width * height * 4` 字节/张（RGBA 近似值），不能只看 PNG/JPEG 压缩大小。
- 将素材预缩放到目标显示尺寸；不要依赖表端缩放超大原图。
- 限制同屏、隐藏层、动画帧、预加载和缓存中的并发解码图片数。更新图片时避免旧图和新图长期同时保留。
- 对长期换图页面，在实机验证普通赋值是否释放图片；若不会释放，保存最小状态并使用页面替换/重建作为受控回收手段。
- 不用图片池较大来放宽 JS heap 约束；图片路径、帧表、元数据和绑定对象仍占 JS heap。

### 8. 适配表盘屏幕

以目标“适配分辨率”设计，以物理分辨率核对素材清晰度。圆屏把关键信息、按钮和滚动区域放入安全区，边缘仅承载可裁切背景。方屏与圆屏布局分支要显式、有限并可测试。

优先稳定的固定基准尺寸配合百分比布局。核对最长中文文本、系统字号、列表滚动、点击/长按/滑动冲突、状态栏/表冠区域和屏幕边缘裁切。不得仅在 466x466 模拟器上通过后宣称兼容 390x390、454x454、408x480、336x480 或 280x456。

**FIT3 坐标系悬案（2026-10-03）**：社区矩阵说布局基准 = 适配分辨率（方 336×396），但本仓已装的
elcton 首页列高 64+336+80 = 480 = 物理高，参考工程 Game2048-FIT3 更直接按 408×480 写死容器——
存在 px ≈ 物理像素的迹象，且这些工程都未显式设 designWidth。定论前新布局把总高控制在 ~380px、
宽度用百分比（336 与 480 两种高度假设都容纳得下），装表后请用户实拍校准再放开尺寸。

### 9. 审计、构建和验证

改动前后运行只读审计：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/audit_lite_watch_project.ps1 -ProjectPath <项目目录> -TargetHeapKB 64 -TargetApi 6
```

日常快速检查可加 `-SkipImageDimensions`；发布前必须去掉该开关以估算解码图片池。SDK 不在默认位置时用 `-SdkApiPath <当前SDK的js/api目录>`。构建后加 `-BuiltJsPath <loader_out_lite中的JS目录>` 检查转译结果。脚本只输出启发式线索，不修改项目。

然后按风险分层验证：

1. 静态检查：`config.json`、页面注册、导入接口、组件白名单、资源路径、权限和生命周期清理。
2. DevEco 构建：确认转译后产物，不直接编辑产物；检查警告和 HAP 大小。
3. Lite Wearable 模拟器：验证启动、路由、布局、交互和基础 API 冒烟。
4. 目标真机：验证冷启动、反复进退页面、长时间运行、快速操作、低存储、传感器/振动/音频/文件、JS heap 峰值、图片连续切换和异常恢复。
5. 最低档回归：若宣称跨代兼容，至少覆盖最低 heap/API/分辨率档；不能只测最高端型号。

模拟器不证明真实传感器、功耗、文件系统差异、图片释放或内存上限。接口文档明确“仅支持真机调试”时，必须将真机结果列为发布阻塞项。

## 页面布局坑（2026-10-10 elcton 实测）

**纵向 flex 页面里用 `if` 挂确认框/弹层，会被排到屏幕外**：`.page` 是 column 时子元素按顺序排
（如 56+4+340+72=472），`if` 的 `.overlay` 排在最后 → 落到 y≈433，484px 屏装不下 →
现象是「点了按钮没反应」：事件其实触发、弹层也渲染了，只是整块看不见。
修法用**纯 flex 换位，不依赖 position**（Lite 对 position 支持没把握时优先这个）：

```html
<div class="page">
  <div class="main" if="{{ !showDeleteConfirm }}">…原有内容…</div>
  <div class="overlay" if="{{ showDeleteConfirm }}">…弹层…</div>
</div>
```

`.main{width:100%;height:100%;flex-direction:column;}`，`.overlay{width:100%;height:100%}`。
验证钩子：lite-sim `?deltap=1`（量弹层 top 是否在屏内 + 按钮是否全可见 + 走完取消/确认链路）。

**纵向各段高度之和必须 ≤484**（FIT3=412x484）：超出会把底部条挤出屏、或列表内容被裁。
详情页曾是内容 356 > 容器 340，删除按钮底部裁掉 16px；按 56+4+352+72=484 精确分配后全可见。

**真机 column 容器 `height:auto` → 子元素塌成 0 高，且模拟器不复现（2026-10-10 实测）**：
确认弹窗 `.dialog` 是全页唯一没写显式 `height` 的容器 → 真机只渲染出 padding
（54px≈28×2），title 与两个按钮全部 0 高不可见（截图逐像素量：弹窗内部白像素=0）；
而浏览器/模拟器自撑开，同一份代码量出来 dialog=288x170、btn=93x48 全正常。
**判据**：只要父容器给了显式高度，`text` 的 auto 高就能正常显示（返回按钮 text 为
auto、父 48px，真机一直正常 —— 反证问题在父不在子）。修法 = 整条链显式化
（dialog 170 / title 42 / row 48 / btn 48 / btn-text 36，总和 56+42+24+48=170 自洽）。
凡 `height:auto` 的 column 容器一律显式化；模拟器验证 ≠ 真机结论，涉及弹层
要用真机截图逐像素量（白像素数即可判文字是否渲染）。

**真机 flex 行容器与模拟器不一致（2026-10-10 连修 3 轮换来的）**：弹窗按钮行
`width:100% + padding-left/right` —— 模拟器生效，真机实测 padding 被忽略、
按钮宽度渲染缩水（写 118 出 97），还贴内容区边缘被裁出平直边。用户装机连报
2 轮才收敛。**可靠结构**：行容器用**固定 px 宽**（如 258 = 按钮+间距+按钮），
靠父容器 `align-items:center` 居中；元素间距用 **margin**（真机已验证生效，
margin-bottom 24 实测准确）；预留 ≥10px 越界余量。对照组：本工程取件码键盘
`.pad`（width:100%+padding+wrap）用户长期使用正常——说明真机 flex 解析行为
不透明，**拿不准就用固定值+margin，别赌百分比/行内 padding**。真机截图逐像素
量测（PIL 按色抓 bbox）是唯一可信验收，模拟器只能证伪自己。

**两个高频复发坑（UI 改版一轮全踩过，新写元素必查）**：
① **每写一个新 column 容器都要显式 height**——不只修复时要防，新建的
`.item-main`（课名/老师纵排）没高度，真机文字全消失（状态点/时间正常，
唯独文字没了=此病）；模拟器浏览器自撑开测不出，只有真机暴露。
② **<text> 元素不要当背景容器**——把 background+border-radius+flex 居中
全写在 text 上（如日期 tab 的圆底），真机背景圆与文字错位；改成
`div(背景) 包 text(纯文字)`，div flex 居中真机可靠（实测圆/字中心对齐）。

**HML 写法差异**：符号字符写进 `@click="addLetter(';')"` 这类表达式，hvigor 会报 00308018
（模拟器解析器放行、真机编译器不放行）；属性里裸 `&` 同样炸。改用数据驱动
`for="{{ (idx,item) in rows }}" @click="handler(item)"`（elcton code.hml 有编译先例）。

## 网络拉取与大响应卡死（2026-10-10 elcton 取件码同步实测，连修 3 轮收敛）

**现象**：手表点「拉取」进度走到 4/6 后界面无声冻结——不闪退、不报错、看门狗不响。

**三重根因（缺一即会复发）**：
1. **异常吞噬=无声冻结的放大器**：`@system.fetch` 的 success 外层 `try{...cb()}catch{}` 会把
   **cb（处理链）内部抛的异常整个吞掉**——此时 `done=true`、单请求看门狗已清 → 链断+无报错+
   无超时 = 完全冻结。修法：`finish` 里 `try{cb()}catch{}` **单独包 cb**，catch 内显式
   `setRow('✗ 处理异常')+running=false`，绝不能让异常掉进外层 catch。
2. **堆渐进逼近 OOM**：JerryScript 堆仅 64/256KB（签到 app 曾因 `ERR_OUT_OF_MEMORY` 把 13KB
   的三屏拆掉；「大 base64 字符串导致真机卡死」是它的实测先例）。分页拉取时若**对象树随页数
   渐进累积**，两版切片（3页×20课 / 6页×10课）都恰好卡在**累计 40 课**——累积阈值特征。
   修法三削：每页 courses **序列化成文本段存放（页对象即丢）**；合并时**逐段 `JSON.parse` 并
   立即置空该段**（避免 11KB 源串+对象树双份）；比对签名前**先比课数长度短路**（跳过两份
   4KB 签名串构造）。注意段格式 `'{..},{..}'`（无外层数组括号），合并统一包一层，防双重嵌套
   `[[..],[..]]` 被 normalize 全部跳过变 0 门（harness 抓过这个回归）。
3. **看门狗盲区**：每请求一个 timer 时，**页间 `setTimeout` 期间无人监管**——页间定时器失效
   即无声死。修法：**全程滑动看门狗**——每个里程碑（发起/到手/合并）`clearTimeout+新设 15s`，
   任何环节停滞必报错；超时回调里 `!self.running` 直接忽略（防报错后遗留 timer 覆盖错误状态）。

**诊断标记环（必做保险丝）**：关键状态 push 短标记（`go p0> p0< w … mg dec app ok / Ecb / TO`），
进度状态行尾附最后标记 `‹p3<›`——真机再卡死时**用户截一行状态图即可定位死点**，不用猜。

**验收方式**：这类问题模拟器/单测复现不了（V8 内存行为不同），必须真机；node harness 可以
验证逻辑链（正常/异常/停滞注入用例）但不证明堆上限。页间隔 400ms、10课/页是真机收敛值，
50ms/20课真机仍卡死。

## 连通自检「卡检测中」排查（2026-10-12 elcton 实测）

**现象**：点自检永远"检测中"，手动重跑无反应。

**排查顺序——先逐层测端点，别先猜代码**：
1. 四层打点：DNS（本地 vs 阿里 DoH `https://dns.alidns.com/resolve?name=X&type=A` 对照判污染）
   → TCP（connect 耗时）→ HTTP（code/total）→ 响应体（自检判据含 `ok`）
2. **整链路断判据**：github / google / jsdelivr / 主机面板**同时**挂 = 手机国际链路或代理上游断，
   不是单台服务器（10-12 实测窗口：12:31 通 → 14:20 全断 → 15:40 自愈，端点服务器全程无辜）
3. **代理假连接特征**：`connect≈4ms 后 0 字节`（海外 IP 物理不可能 4ms）= TUN/代理本地 SYN-ACK
   上游转发失败；`connect≈118ms` 真实 RTT 才是真通
4. fake-IP 判据：裸 DNS 查 github 得 `198.18.x.x` = 路径上有 fake-IP 代理（连发给 223.5.5.5 的
   查询都被劫持应答）
5. 交叉证：hmlwsim 里跑同页，apiSim_fetch 立即 fail → 行显示 `✗ -1` = JS 链路全通；
   **模拟器秒出 + 真机卡死 = 网络层问题**，不是代码

**代码第二层保险——手动强制复位模式**：断网挂死会把 `running` 卡 true，`health()` 入口互斥把
后续手动点击静默吞掉（表象=点了没反应、detail 变了行不变）。手动路径必须先
`this.running = false; this.gen++;` 再 `health()`——gen+1 依赖 `finish` 现成的 gen 守卫作废旧
回调/旧看门狗，无副作用。elcton 已落地（commit `5d440e5`）。

## 输出要求

每次开发或审查都给出：

- 目标设备档案与仍未知字段。
- 使用的 API/组件及最低版本、权限、Lite Wearable 差异。
- JS heap 风险：常驻数据、峰值临时数据、定时器/订阅和清理点。
- 语法风险：`.js` 源码是否完全属于文档列出的 Lite ES6 子集，HML 表达式是否保持 ES5，构建产物是否仍含不支持的语法/运行时依赖或高成本 helper。
- 图片池风险：最大解码尺寸、最大并发图数和释放策略。
- 资源风险：`common`/`rawfile` 选择、静态路径存在性、file API 真机验证状态和可写复制目标。
- 音频风险：权限、真实格式、复制状态、播放路径、单音源切换、音量和销毁清理。
- 已执行的构建/模拟器/真机验证；未执行项必须明确说明，不能用“应该可用”替代。
- 兼容性结论：已验证、资料支持但未实测、或未知，三者分开标记。

按 [review-output-template.md](references/review-output-template.md) 组织结论。发现问题时按影响排序，引用真实源码文件和行号；不要把审计脚本的启发式警告直接写成确定缺陷，必须回到源码验证。

不要为了降低内存删除用户要求的功能。先采用分片、懒加载、有限缓存、资源缩放和生命周期回收；仍超预算时再说明具体取舍。

## 参考资料

- 设备和 heap 档位：[device-compatibility.md](references/device-compatibility.md)
- SDK、本地资料与演示工程索引：[sdk-and-sources.md](references/sdk-and-sources.md)
- `common`、`rawfile` 与真机文件路径规范：[resource-layout-and-paths.md](references/resource-layout-and-paths.md)
- 内存与运行时细则：[memory-and-runtime.md](references/memory-and-runtime.md)
- JerryScript 语法规范：[jerryscript-syntax.md](references/jerryscript-syntax.md)
- HML Lite 标签、属性、事件与表达式白名单：[hml-lite-syntax.md](references/hml-lite-syntax.md)
- 传感器、权限、频率和生命周期：[sensors-on-lite-wearable.md](references/sensors-on-lite-wearable.md)
- 文件、rawfile 与键值存储接口：[file-and-storage-on-lite-wearable.md](references/file-and-storage-on-lite-wearable.md)
- 振动接口与权限：[vibrator-on-lite-wearable.md](references/vibrator-on-lite-wearable.md)
- `shalu2` 音频实现规范：[audio-on-lite-wearable.md](references/audio-on-lite-wearable.md)
- 审查与交付模板：[review-output-template.md](references/review-output-template.md)
- 构建/安装错误实录（FIT3 真机踩坑，按报错文案检索）：[build-install-error-catalog.md](references/build-install-error-catalog.md)
- 安装/开发错误码总表（23/27/28/30/40/82 等，论坛整理+实战注解）：[install-error-codes.md](references/install-error-codes.md)
