# 编译 Logger HOST QA（独立，不接入旧 gates）

`compiled-logger-host.mjs` 只解释输入 APP 中的实际 SDK `app.js` 字节；拒绝 ES-module 源码，不改 export、不重建 SDK。`--app` 通过仓库 `tools/sign/node_modules/jszip` 读取唯一 inner HAP 的 `js/<ability>/app.js`；签名 HAP 若不是资源 ZIP，先由父独立解出实际 JS，再用 `--js`。不会绕过签名格式伪造输入。

```sh
# public-build 占位配置含非空 key，实际 logger 已启用：应 expect configured
node qa/we-handshake-20261115/compiled-logger-host.mjs --app /actual/public-build.app --report /parent/HOST-public-build.json --expect configured
# --expect public 仅用于另行确认 endpoint/key 真正禁用的实际编译输入
node qa/we-handshake-20261115/compiled-logger-host.mjs --app /actual/disabled.app --report /parent/HOST-disabled.json --expect public
node qa/we-handshake-20261115/compiled-logger-host.mjs --app /actual/configured.app --report /parent/HOST-configured.json --expect configured
# 或 --js /actual/extracted/app.js
```

HOST 边界：Node VM + 明确 ViewModel/requireNative/device/fetch/timer 适配器，timer ID 从有效的 `0` 起；虚拟时钟，不等待 5 秒。未知 native 模块拒绝。无 `--network`，无 HTTP/socket/装机/Chrome。fetch 仅在内存读取实际 logger 生成的请求 body，并同步回调 **HOST MOCK ACK，NOT real network/cloud/native**；配置中的 endpoint/key 不由 QA 注入、打印或写报告。

为了调用同一个真实 bundled `L.page/flush/status/stop`，Node inspector 在实际 onCreate 的函数断点读取原 closure 的模块引用，交给 ViewModel HOST observer；不重写 bundle、不合成模块、不补 export。需要运行环境支持 `node:inspector` 的同步 Session API，否则 fail closed。

configured 路径：fresh counters=0 → 实际 onCreate（内含 L.page/MainAbility 与原 console.info）→ seq/pending≥2 与 live timer 0/5000ms → 同例 L.page → 实际 `_elctonLog('SEND_FAIL', {code:206,arg1:210301031,arg2:0,type1:3,type2:3})` → flush/50ms → 在实际 body 断言 exact safe row、连续 seq、HOST ACK 排空 → onDestroy 清 timer/pending/busy、sent/seq 收敛且恢复全部原 console。另验证原 `_elctonWearChannel` 字段存在及原 bundled 引用。

public 路径单独验**真正禁用**的配置（空 key / 未启用 endpoint），不是按产物公开与否判断：仍跑实际 lifecycle/page/stage/flush/destroy，但 seq/pending=0、console 不 hook、无 fetch。带非空占位 key 的 public-build APP 实际 enabled，必须使用 `--expect configured`；不可把这种占位产物当作 disabled 覆盖。public 通过 **不等于 configured 路径通过**，分别由 `public_disabled_verified` / `configured_lifecycle_verified` 表示。

报告只有检查布尔值、计数、JS SHA256、路径和时钟；不保存 row、body、URL、key、sid 或 compiled 异常文本。`native_verified/real_cloud_ack_verified/new_ci_provenance_verified` 永远 false；输入是否来自指定新 CI、collector raw GET、签名与交付均由父负责。

## 当前简证

- 在提交 `a197eecb83a6e15a7f4cdb930c1205ec9c84b1ef` 的限定工作树新增上述 QA 与本说明；未改 product/tests/workflow/旧 gates，未提交。
- `node --check` 与 `--help` 已运行成功。Node inspector 的普通 closure 原引用观察 probe 已实际运行成功（HOST 自检，不是 SDK 验证）。四个负例已实际执行：缺输入、`--network`、直接源码、旧实际 compiled page 均 exit=1 且 native=false；源码在 SDK bundle 形状检查拒绝，旧 page 在未建模 native 模块处拒绝（不是新 app 验证）。
- 新 CI `43620391145` upload 跳过、没有新 APP；**本子任务未完成新 compiled APP 验证**。父拿到真实编译输入后按实际配置选择上述命令：带非空占位 key 的 public-build 和私有 configured 均 `--expect configured`，另行确认真正禁用的输入才 `--expect public`。不能用源码或 synthesized fixture 替代。

## HTTPS QA r2 修复与测试边界

`compiled-logger-https.mjs` 的直接 CLI 仍读取指定实际 APP 的未改编译字节并使用真实 Node HTTPS；导入模块仅暴露同一 transport/lifecycle helper，不会读取运行配置、联网或执行 APP。固定安全失败码替代含 actual/expected 的私值断言；request/response error、aborted、timeout 共用 settled gate，关闭独占 request/socket。初始化、exercise、destroy 分别捕获；先记录 `post_destroy` 的 pending/busy、原 console 身份与 timer/request/socket，再应急清理，全部验收后才置 passed。

独立短测试：`node --test tests/compiledLoggerHttps.test.mjs`。内存 EventEmitter 与生命周期 stub 只测试 **QA 本身**，不生成 SDK，不读取 secret，不运行编译 APP；RED/GREEN 原件位于 `evidence/https-r2-*.tap`。这些通过不代表真实 HTTPS、canonical/collector 对账、原生/FIT3/WE 或新 CI 验收。
