# 表端已开始接收，手机仍无 READY / 206：源码结论与证据

## 结论与边界

用户已在 FIT3 同步页点“开始接收”；设备发现 deviceCount=1，Scope 已结案。本棒没有重新调查 Scope、没有操作真机。

已证实并修复的是 **接收生命周期、官方 SDK 初始化/消息总线路由及握手错误证据链**。不是手机与表的包名/签名不一致，也不是两端没有定义 HELLO/READY。旧表已经实现主动 READY 和 HELLO 应答，只是失败回调缺失或证据过于笼统。

原始两轮只有手机状态，没有表按钮时间戳、实际服务版本与原生注册回调，所以 **不能断言其中某一项就是这两轮206的唯一底层原因，也不能宣称真机已经连通**。下列源码缺陷是真实可复现的，具体归因由这次候选包的真机阶段标记闭合。

固定基线：表 `0be04ed667392401c6024d892feb6983928c903c`；手机 `cd2a3e062b97d778c79b76b544071b1077534af7`。
构建源码：表 `73c7823ca69deb5e176df52dda89fd02940db67c`；手机 `2097f32ab9ef573e060ef42d076799c9c274e38b`。

以下“表文件”均相对于 `entry/src/main/js/MainAbility/`，“手机文件”均相对于 `app/src/main/java/com/hcbiu/elcton/`。

## A. 已确认的源码缺陷

1. **“开始接收”并不代表持续监听。**
   基线表 `pages/phone-sync/phone-sync.js:38-48`：30秒回调无条件调用 `stop()`；`:156-164`：stop关闭消息通道、置 listening=false。`common/wearChannel.js:9`：close调用原生 `unsubscribeMsg()`。因此先开接收、稍晚连接，确实会失去接收器。官方 FAQ 原文：“手机或轻量级智能穿戴设备侧应用没有注册消息接收器”（留档 `evidence/official/faq-0000001050818031.txt:105-116`）。
   修复：候选页 `:38-49` 仅在**真实协商成功、注册成功、空闲且没有读盘/事务**时保留监听；初始化、pending HELLO读盘和事务仍有30秒期限。`:170-184` stop/hide/destroy/cancel仍退订。无版本查询 API 的兼容分支仍30秒，不冒充协商成功。

2. **旧通道跳过官方 JS SDK 服务协商，所有版本一律直接调用 native 消息总线。**
   基线 `common/wearChannel.js:16-29` 直接 setPackageName/setFingerprint/subscribeMsg，文件中无 getWearEngineVersion。现存华为 Apache-2.0 SDK 参考 `references/source-apps/腕上词典-FIT3/entry/src/main/js/default/common/wearengine.js:43-71` 定义 sdkVersion="3" 并调用 getWearEngineVersion；`:241-251` 明确 >=401走wearengine，否则走FeatureAbility。这证实旧实现偏离官方 SDK 控制流；契约模型可复现选错总线，但不证明 FIT3 固件实际版本或 native内部必须该参数。
   修复：`common/wearService.js:70-87` 查询并严格校验四段数字版本，未知/坏版本失败；`:40-45` 按303阈值配置包名；`:48-68,82-85` 按401选总线并等注册成功。应用 `app.js` 暴露factory，`common/wearChannel.js`仅在查询API存在时接入。实际 CI compiled app/page 经原 hmlwsim Sandbox 五模式验证，见 `evidence/compiled-ready-host-73c7823.json`；**它使用显式API夹具，不是蓝牙或真机证据**。

3. **READY的发送失败丢证据。**
   基线页 `:151-153`：主动READY `_channel.send(response)`无回调；`:125-126`：HELLO应答只显示笼统失败。表已尝试回执，但如果手机接收器尚未注册或底层206，原界面缺少发送阶段/码值。
   修复：候选页 `:125-127,148-168` 主动READY和HELLO回复统一走reply；`common/wearService.js:89-100`保留READY_OK/SEND_<原生码>及有界阶段环，不打印课表。主动READY早于手机监听而失败**不必然代表后续握手失败**；手机注册成功后发HELLO，再回READY才是本轮关键回执。

4. **手机等待READY时忽略合法准备ERROR，误导为再次点接收。**
   基线手机 `WearProbe.kt:146-186`仅在握手阶段处理READY，其余ERROR因无session被跳过；`:143-144`超时文案要求进入表页并点接收。修复 `PacketIngress.kt:7-11`与 `WearProbe.kt:147-149`：只接受已过PacketIngress验证、空transferId、awaitingReady且无活动事务的ERROR；准确呈现“手表准备失败（码值）”。`:144`不再把已开始接收的用户归咎为未点按钮。事务关联ERROR/ACK/APPLIED及清理逻辑不变。

5. **复审负例。**
   坏格式版本不能被最后一段401误判；pending HELLO读盘不能永久绕过看门狗；异步setPackageName的complete内若setFingerprint缺失/抛错，必须在回调内部捕获并显式CONFIG_UNAVAILABLE+cleanup。每项保留RED日志和新增测试。R1/R2不通过报告不覆盖，R3两轴0阻断。

## B. 包名、指纹、配置与监听逐项核对

- 手机包：`com.hcbiu.elcton`。最终APK实际证书SHA256：`fc08a0b474a8ffca5887bd5c88ac15e865a63a64eca81c10f344496c46d9ad94`；匹配表 `common/wearIdentity.js` 与实际compiled同步页。
- 表包：`watchapp.nexus.0zzip`。手机 `WearProbe.kt:50-52,120`配置该包及 `bundleName_Base64(65B EC未压缩点)`；最终HAP profile开发证书独立推导与常量一致，详见 `evidence/actual-dual-identity.json`。**Lite指纹不是证书SHA256、SPKI或SPKI摘要。**
- 官方签名原文：`Fingerprint information = App package name _base64Encode(pubKey)`，见 `evidence/official/signature-0000001053969657.txt:24-35`。
- 表源码config不含supportLists；实际互配由运行时setPackageName/setFingerprint设置。官方发送点对点文档明确：“轻量级智能穿戴设备系统 HarmonyOS 2.0以下版本不支持调用setPeerFingerPrint方法，请使用config.json配置方式”，留档 `send-message-0000001052460491.txt:66-79`。本棒没有凭FAQ标题盲目添加元数据或改变签名清单；最终HAP config与旧包除版本外完全一致。该动态路径的**当前FIT3固件接受性仍待真机确认，不宣称覆盖HarmonyOS2.0以下设备**。
- 手机接收器 `WearProbe.kt:124-136`：只收DATA≤1024B ASCII；先registerReceiver成功，再发HELLO。表候选 `wearService.js:53-67`：register确认后才open，接收非文件字符串并交给现有协议校验；`:98-99`向remote、明确手机包发ASCII JSON。HELLO/READY均非空，协议elcton.sync/version1，phone/watch方向相符。
- 前台约束：官方FAQ列“轻量级智能穿戴设备侧应用不在前台”；表hide/destroy停止是保留的正确约束，本棒没有后台唤醒或绕过系统限制。用户必须保持同步页在前台。实际蓝牙健康/当前HMS路由不由静态测试证明，Scope不重开。

## C. 官方返回码与引用

官方返回码：“ERROR_CODE_COMM_FAIL / 206”及“ERROR_CODE_COMM_SUCCESS / 207”（`errocode-0000001054450278.txt:228-244`）。FAQ列包名/指纹、前台、注册接收器、空消息、蓝牙五类原因。207只是传输结果，不是课表保存证据；最终同步成功仍需APPLIED与回读一致。

原文URL与本次获取正文（HTTP200/code0）一起保存在evidence/official/，不是只凭搜索标题：
- https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/faq-0000001050818031
- https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/errocode-0000001054450278
- https://developer.huawei.com/consumer/en/doc/connectivity-Guides/signature-0000001053969657
- https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/send-message-0000001052460491
- https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/point-to-point-message-0000001052164296

## D. 实际执行与未执行

本地原测试逐字不改：29个既有表测试文件、20个既有手机JUnit文件；表CI251/251；手机CI89/89无失败/跳过（含真实Android候选BuildConfig）；纯Kotlin88/88、Python75/75。原锁版本测试及旧失败日志保留，CI显式-PelctonP2pCandidate=true，最终二进制0.2.8/code10另验，不能拿默认0.2.6源码断言冒充候选版本正确。

最终HAP CMS/profile/证书链/有效期/28项资源全集/1B破坏负例/AST本地复验通过；7份实际JS的原SDK parse-only在CI全过，哈希与本地载荷逐一绑定。同步页40979B、最大页43685B，均<49152B；应用factory5954B。hml/css/首页/周/详情/键盘/资源集合不改，新逻辑放应用factory避免48KiB同步页复制。

目标唯一实物FIT3，412×484来自既有实测。当前固件/实际WearEngine版本/最低堆/所有机型兼容仍未知；这次没有新增图片、音频、权限或布局改动。没有浏览器像素验收、没有真机装机点击；SDK解析、Node控制流和CMS都不能替代这些。这里只交付真机候选包与判读路径。
