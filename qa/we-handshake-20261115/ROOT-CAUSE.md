# 1.1.16：WE 握手失败取证与已证缺陷修复

## 结论（请先读）

这不是“已验通蓝牙”的报告。11月14日晚至少四轮真实 HELLO/READY 失败成立；今晚无人操作手表，不能实时握手。已修复的是可重现的表端回调诊断丢失、阶段摘要覆盖、晚到注册失败未终止接收代际及有依据的版本值形状兼容，并加入用户指定 logger 和同步页常亮。**这四轮失败的唯一底层根因仍未知；新包是明早真机验收候选。** 未改手机0.2.9、对端包名/公钥指纹、P2P运输总线或签名材料。

基线：`83d58a8f931848bdf65bb923e5579ff7285a0714`；修复分支：`fix/we-handshake-logger-20261115`；目标：FIT3 / Solo-B19S，既有实际窗口412×484，手机com.hcbiu.elcton 0.2.9/code11。当前手表固件、原生失败参数及实际WE版本需新日志，不能由Node夹具推导。

## A. SEND_0 为什么不是“发送成功”

固定基线 `common/wearChannel.js:45` 和 `common/wearService.js:12–14,98–99` 把 `fail(d,c)` 的第二参当错误码，丢掉第一参和原始参数类型，造成界面只显示SEND_0。官方原始JS SDK5.0.2.306 `sendMessage` 的 `failedCallback(data,code)` **对所有fail回调报告业务206**；只在success回调报告207。它没有把callback第二参0定义为成功，也没有定义16/0等真机参数的唯一含义。

原件：`research/official-sdk-5.0.2.306.source.txt`（SHA256 `8c7f1100c840abdb237991b0d436ef9ab49a215269c5fecdb3dd59fe63a71471`）；官方正文及原生反汇编证据见 `research/sdk-callback-report.md` 和 `research/evidence/official/`。官方Android消息发送文档：[point-to-point-message](https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/point-to-point-message-0000001052164296)。JS轻量端原SDK契约与Android业务错误码分开取证，不套用另一端参数解释。

修复：`entry/src/main/js/MainAbility/common/wearService.js` 和 `wearChannel.js` 的发送fail统一 `SEND_206`，success记录207，回调幂等/代际取消保留。`wearTrace.js` 记录两个原生参数的**类型、存在性、有界数值/短数字串及固定own-data数值code字段**，不 stringify 自由文本、消息正文、身份/指纹、密钥或未知错误对象。固定字段上限9位数字/±999999999；应用 `_elctonLog` 二次白名单过滤并截断160字符。缺少原生参数就保留缺失，不伪造为真实0。

## B. 为什么截图没有SDK/REG不证明“从未注册”

固定基线已经在版本、包名、证书、注册成功后更新summary；但页 `reply` 把detail整个替换成“回执失败 SEND_0”，覆盖了SDK/VER/PKG/CERT/REG。主动READY早于手机监听而发送失败，也不证明稍后的真实HELLO一定失败。

修复：`pages/phone-sync/phone-sync.js` 中 `channelSummary` / `reply` / 准备ERROR路径先保留有界summary，再附回执失败；保留已有HELLO及READY状态。SDK/VER/PKG/CERT/REG各阶段开始/成功/失败、入站HELLO、READY准备/发送结果全部通过 `$app` 的应用级logger留下固定标签，**主动准备READY不伪造入站HELLO**。真实HELLO→READY仍须手机读ready并回读课表。

## C. 注册/版本安全缺陷

- `subscribeMsg` 已成功后仍可能晚到fail。旧逻辑可能忽略第二次回调，留下“接收中”状态。新代际失败立即close/open=false、作废旧接收/发送，回调错误通知页面；不会把send失败误当自动退订（原SDK没有该语义）。
- 官方版本协商取字符串最后一段服务版本。旧实现固定四段，小范围真实表示值可能被误拒。新解析支持1–4段有界数字服务版本，仍拒坏串、非数字、低于302、空值及超长值，不从包含401的任意字符串猜成功。
- 总线保持官方分界：>=401 native，302–400 FeatureAbility；缺版本API走原有明确未协商兼容通道，`isNegotiated=false`，不无限延长旧分支监听。没有为了让测试绿重新选择总线。

严格RED→GREEN原件：`handshake/native-contract-red.log` → `native-contract-green-final.log`（45/45）；`preparation-summary-red.log` 保留。正常/缺失/数字串/安全对象字段/异常字段/晚回调/注册失败/重复成功/版值形状/准备ERROR均有负例。

## D. 两个此前疑点已澄清

1. **`p2p_capability:0` 不是“不支持”枚举。** 实际APK打包的华为Device类定义 `P2P_CAPABILITY_SUPPORTED=0`、`NOT_SUPPORTED=1`、`UNKNOWN=-1`。同版本官方Android AAR的Device/DeviceJsonUtil、查询设备官方正文共同对账。它说明该SDK报告支持，并不证明当前端到端通道成功；不据0新增HTTPS回退或修改手机策略。
2. **10月10日真机取件码同步是云端fetch，不是WE known-good。** Git原件显示取件码JSON分页→`@system.fetch`→本地课表；那时无当前WE app.js/adapter/receiver。无法以该成功直接二分出WE回归。详见 `research/history-capability-report.md`。

实际手机APK和表1.1.15 profile公共身份双向对账相符（`research/evidence/apk/public-dual-identity-actual.json`）：Android→Lite必须 `bundleName_Base64(65B EC未压缩点)`，表→Android用证书SHA256；手机manifest/pkg/版本和表对端常量也一致。没有重新开Scope、申请证书或臆改supportLists。

## E. 用户令A：logger

应用 `app.js:onCreate` 初始化一次、页名MainAbility；`onDestroy` finally stop，既有console仍转发。canonical固定2921B、上游commit80b09b6；严格计数锁定ACE timer ID0/null及执行时watchdog自清兼容变换产生3018B（<=3072B）。vendor原件不变。

公开仓CI先生成disabled配置跑**全部原测试与新增测试**，SDK前保留移动disabledstub并生成public-only无效占位；真实endpoint/WRITE key仅在下载后本地替actual SDK app.js及其存在的map，其他文件逐字不变，拒任何.bc/JRRY/gzip。read_key/签名私钥不进HAP或CI。新实际包门检应用/全部页面48KiB、页集合/版本、日志阶段及配置；源模块存在不等于原生HTTPS成功。

logger17/17源测试；额外流水线4/4及包验证器11/11包括字节码、超预算、外部依赖、丢stage/init/占位及页集不一致负控。最初新增测试fixture自身错误原件保留，修fixture补正确API字段/真实依赖后门禁原逻辑不放宽。新SDK生命周期及真实HTTPS→cloud→独立collector证据待CI产物生成后补DELIVERY；Node/宿主云上传不是手表源E2E。

## F. 用户令B：同步页常亮

`common/wearAwake.js` guarded require Lite白名单 `@system.brightness.setKeepScreenOn`；`phone-sync.onShow`请求true，hide/back/legacy/destroy请求false。不改brightness/mode，不新增interval；取消接收但留在页内仍保持本页请求，离页恢复默认熄屏策略。迟到native回调按最新visibility修正；missing/throw/fail不崩溃。27/27生命周期测试通过。

实际本地SDK `@system.brightness.d.ts`：since3，reserved liteWearable；无 `getKeepScreenOn`，未调用不存在API。盖屏/系统策略仍可灭屏，需明早用真实FIT3确认；测试不保证无限常亮。原HML/CSS、首页/周/详情/键盘/删除设计、图片和音频资源不改。

## G. 当前验证及待验边界

本地全量355/355，0失败0跳过；原32测试+loader共33文件逐字不变，手机74保护文件SHA不变；签名器/原解析/AST/compaction/旧final_gate保持原字节，新1.1.16 gate仅candidate version变化。独立SPEC通过；QUALITY及CI/实际包/强验/远端证据读回见最终DELIVERY（没有凭计划计通过）。

新包JS常驻多了有界24条队列，batch8，有drop计数；最大峰值JSON/闭包/原生堆仍待真机。源3072B及包49152B硬门保持，V8不证明低堆、功耗、蓝牙或文件系统。没有浏览器/像素验收，没有安装/点表/手机抢前台，不称“全部支持机型已验”。

明早：用户安装新同身份HAP→周视图→同步→开始接收；发起方手机MCP `devices_list→sync_connect→sync_state→start_publish→courses_read`。失败同时拉表logger＋手机error_tail(limit128)/diag_read，按SDK/VER/BUS/PKG/CERT/REG/HELLO/READY/SEND和原生两个数值区分失败层。SDK注册成功、207只是各自阶段，不等于APPLIED+回读成功。
