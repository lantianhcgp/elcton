# 10 月 10 日历史通道、1.1.15 注册协商与 P2P 能力核查

核查日期：2026-11-15（CST）。性质：**只读历史、官方 SDK、实际交付产物审计，不是本轮真机握手验通**。不使用 session 叙述作为主证；无 CI、安装、启动、点击手机、浏览器或表盘改动。仅写本报告及同级 `evidence/`。手表比较冻结在 HEAD `83d58a8f931848bdf65bb923e5579ff7285a0714`，不把父任务同时进行的未提交修复混入 1.1.15 基线。

## 结论先行

1. **10 月 10 日已使用的同步通道是取件码云中转 → `@system.fetch`，不是 Wear Engine 应用 P2P。** 实际取件码端点为 `http://kebiao.qingyun3.com/api.php?action=get&pickup=…`；HTTPS 200 属于之前的公网可达性探测，不能把它写成取件码端点为 HTTPS。大课表三轮收敛的最后修复提交时间实际是 **10 月 11 日 00:12:08 +08:00**，不应虚称 10 月 10 日某个 WE 包曾双向握手验通。[H1–H4]
2. **`p2p_capability:0` 在实际 Android SDK 中是支持：`DEVICE_CAPABILITY_SUPPORT=0`；1=不支持；2=未知。** 返回类型 `int`，不是 bitmask；SDK 缺字段、空输入或 JSON 解析失败的默认返回为 **2，不是0**。手机 `devices_list` 原样输出 SDK 值，不能从0推出“没有能力”“尚未注册”或“两向从未建立”。0 同样不能证明两向已建立。[S1–S3、P1]
3. **手机0.2.9实际APK → 表1.1.15实际HAP的公开对端身份匹配。** 已重新核对 APK DEX 字符串及选择性 smali，读取签名 HAP 实际文件表、验 CMS/profile、从实际证书导出65字节 SEC1 EC点，二者一致；不存在本次已证实的包名或指纹常量不匹配。[A1–A3]
4. **唯一握手根因未证实。** `SEND_0` 是现有失败路径对无数字第二参数的归零记录，不是官方成功码；页面回执错误会覆盖先前 REG 摘要，因此当前截图缺 REG 不能推成没注册。缺同一时段的 REG→HELLO→READY 双端完整证据。HAP 的 HEADER/app.bundleName 与 `module.package` 有实际字段差异，但固件究竟以哪个字段参与路由仍未确定。[W1–W3、A4]
5. **`Capability.hasAvailableP2pService` 不能被当作这份 Android AAR 的已存在 API。** 已核验 AAR、官方 Lite JS SDK、本项目代码均无此方法；本轮拿到的官方 Android“查询可用穿戴设备”正文是 `DeviceClient.hasAvailableDevices()`。对题述方法的所属平台、类型合同仍有证据缺口，不编造返回类型或数值映射。[S4、E1]

## 一、历史 known-good 到底证明什么

### 原代码与当时文档

- `f8a8d732…` 的 `docs/lan-sync-probe.md` 记录：在正确手机内网IP、服务自检200、关闭代理后，内网探针仍 `-6` 且服务端探测窗口零命中；因此当时选择云中转，而非手机局域网 HTTP 直连。公网 HTTPS 小响应能200、纯IP HTTP能真实404，只证明 fetch 公网路径可达。[H1]
- 10月10日 `697ee9df…` 版本 `docs/pickup-code.md` 明列 HTTP 网站/API/探活，并记录60课大响应及切片卡死。这一记录本身不是“60课已验通”证明。[H2]
- `e1f60dda…` 的实际 `sync.js:25–29` 为 HTTP `SITE/LEGACY`，通过 fetch请求与页序列取得文档，最终归一化并写入本地。此 revision 的主动应用目录搜索没有 `wearengine/FeatureAbility/subscribeMsg/setFingerprint/HELLO/READY` 命中。[H3]
- Git 时间线：10月10日23:38整份→20课分页；23:50改10课/页、400ms；10月11日00:12修异常吞噬、堆累积和看门狗；00:13的文档将末轮修复记入“2026-10-10事故”。这解释了“10月10日验通”口头时间锚，但**没有精确最终装机包 SHA/双端原始日志，不能新增一个已验证WE金样**。[H4]
- 本项目实际 WE `wearChannel.js/phone-sync` 管线首次入历史是 `6283d964…`，时间 **2026-10-31 18:16:45 +08:00**。提交标题的“verified”不自动等于真机双向握手证据。[H5]

**可复用的历史成功基线：公网fetch取件码路径。不可复用的假前提：WE曾在10月10日双向握手成功，所以现在仅是同通道回归。**

## 二、good → 1.1.15 的注册/协商差异

| 项目 | 10月10日取件码/fetch | WE前版 `0be04ed…` | 1.1.15冻结HEAD `83d58a8…` |
|---|---|---|---|
| 数据通道 | HTTP公网GET分页 | `@system.wearengine` 消息 | 根据Wear Engine服务版本选消息总线 |
| 对端身份 | URL+取件码，不需P2P接收注册 | 动态`setPackageName`→`setFingerprint` | >=303先PKG→CERT；302跳PKG，仅CERT |
| 服务协商 | 无 | 无版本查询，固定engine收发 | `getWearEngineVersion({sdkVersion:'3'})`；严格四段数字，末段>=302 |
| 消息总线 | fetch模块 | engine.subscribe/send/unsubscribe | >=401使用engine；302/303等<401用`FeatureAbility`，三个方法缺失则BUS_UNAVAILABLE |
| 注册完成 | HTTP success不是接收注册 | 无data或isRegister即open | 同样需无data/isRegister；标REG后open/negotiated，再执行准备流程 |
| READY | 不存在 | WE协议准备回复 | 注册成功后本地合成HELLO触发主动READY；远端HELLO还可再次请求READY |
| 前台/生命周期 | 同步页请求代际、超时 | 接收页30秒约束 | 正常协商且已空闲准备时避免30秒退订；初始化、读盘、忙会话仍有限时；onHide/onDestroy照旧stop |
| 可观测性 | fetch页进度环 | SET/REGISTER/SEND字符串 | SDK/VER/PKG/CERT/REG/HELLO/READY_OK短环最多6项；错误detail可盖掉summary |

出处：[H3、W1–W3、W4]。1.1.15的无版本兼容支路仍固定engine，并返回 `UNVERSIONED`、`isNegotiated=false`，保留旧有有限等待；它不能冒充成功服务协商。>=401先 `unsubscribeMsg()`，然后subscribe；这一版使用的是直接原生适配，不是调用官方JS包装类。[W1、W2]

这是一条新增并持续修订的 WE 通道，不是fetch的“注册配置小改”。因此不能从旧云同步成功推断今天的PKG/CERT/REG、前台总线或反向READY已成立。

## 三、0.2.9 的 devices_list、能力值及注册顺序

### 值的生成链

`PhoneRuntime.kt:96–98 devices_list` → `PhoneActions.devicesJson():55–58` → 当前 `SyncEngine.state.devices` → `WearProbe.scan():118–126 getCommonDevice` → `SyncDevice(..., device.isConnected, device.p2pCapability)`。没有把Boolean转0/1、没有把设备型号当能力，没有把空列表造出虚拟设备。[P1]

- `refresh:true` 先序列化现有列表再发起异步scan，并标pending；不能当作“该响应已完成新查询”。需等待新结果，而不是拿旧快照推断即时连接状态。
- DTO `SyncDevice.p2pCapability` 本地构造默认是0，**这是本项目DTO默认，不是官方SDK默认**；真实扫描显式传入了SDK值。若将来其他构造路径省略值，可单独建议默认UNKNOWN=2，但这不是当前scan得到0的根因。[P2]
- `DevicePolicy` 使用 `connected && (p2p == supported || p2p != unsupported)`，实际传supported=0、unsupported=1：已连接0可尝试，明确1拒绝，未知2允许实际探测但不称已验证。现有逻辑没有“把0挡成不支持”的缺陷。[P2]

### 官方 AAR 实证

本地官方原始 `android-aar.zip` 内容是 Wear Engine **5.0.3.301 AAR**，SHA256 `97adb85c1092c8b9660b7d26eb7a0bccb162201f1eea1f85373a7f59e827d2ca`。抽出的 `classes.jar` 与既有反编译来源逐字节相等；本轮额外执行 `javap -p -c -constants`，不只依赖jadx伪源码。

- `Device.java:10–13,118–120`：三枚离散能力常量0/1/2，`getP2pCapability():int`。
- `DeviceJsonUtil.java:58–60`：读取JSON键 `device_p2p_capability`，传fallback=2。
- `common/a.java:158–173`：空字符串、缺键或JSONException均返回传入fallback；有键使用 `getInt`，无任何位运算。
- `Device.isConnected()`另行比较连接状态2，不能把“能力值2=UNKNOWN”混同“连接状态2=CONNECTED”。[S1–S3]

**正确三层判读：** 能力0=SDK报告支持；connected=当前设备列表报告已连接；注册和应用握手=仍必须独立看register任务结果、HELLO接收、READY接纳。三者不能互换。

### 手机实际顺序（已核源码与实际APK）

1. Application Context懒建 `HiWear.getP2pClient`，scan获取真实Device。
2. connect先能力/连接判定，随后 `installed()`：`identify()`设置peer package→peer fingerprint，再 `isAppInstalled`。
3. 确认installed=true后，`register()`先注销旧接收器、建立本地代际与Receiver；再次 `identify()`，再调用 `p2p.registerReceiver(selected, receiver)`。
4. **只有register任务成功且仍为当前代际**，SyncEngine才进入awaitingReady并发送HELLO。
5. HELLO在5秒窗口下重试最多初次+3次；严格通过 `PacketIngress.watch` 的READY才将ready=true。`send()`不再重设身份，但走的是同一个先注册成功的p2p对象。
6. 当前Receiver仅接纳 `MESSAGE_TYPE_DATA`、<=1024字节、ASCII32–126；协议与精确数值版本随后再校验。[P2、P3、A2]

未找到“手机先发HELLO后注册”“漏设peer fingerprint”或“扫描0直接拒绝”的静态根因。注册任务成功不证明手表READY回到手机；`isAppInstalled=true`也不证明手表在前台或注册成功。异常日志捕获在 `WearProbe.describe()`，本轮没有调用手机接口获取新日志。[P3]

## 四、实际双包身份与 HEADER/module.package 未决点

### 双向公开身份

本次读取的0.2.9 APK：

- package `com.hcbiu.elcton`，versionName `0.2.9`，versionCode `11`。
- SHA256 `664e8eae402f8390b8fcf63d0818d5a96c07b1222d06230f3f7b0927908b5065`，CRC通过；原artifact receipt绑定构建源码 `84a6c406…`，相关握手源码与冻结手机HEAD无差异。
- DEX实际peer package=`watchapp.nexus.0zzip`；实际peer fingerprint=`watchapp.nexus.0zzip_BOc6BPXgVZY7Ik7lETcDy6ezKw77Dqm0EDBscNFv9kHcXaW7gXBRQmA8RfLcDvcCLkOSQIsB33zj/s2IS6u5utM=`。

本次读取的1.1.15 HAP：SHA256 `8865474d76d278f6d61050f4cebca1c1a70b0f5f391f653523d9c9018c91bac0`。实际profile bundle=`watchapp.nexus.0zzip`，实际证书原始65字节点导出的peer identity与上面**相等**；实际编译接收页含手机包 `com.hcbiu.elcton` 和手机签名SHA256 `fc08a0b474a8ffca5887bd5c88ac15e865a63a64eca81c10f344496c46d9ad94`。本轮CMS验证通过、签名者与profile证书相等、签名摘要绑定实际载荷。[A1–A3]

这证明**指定磁盘交付产物**身份匹配，不证明两台设备当前实际已装同一SHA，也不证明固件动态API已接受身份。不得以此强制排除设备/前台/运行时问题。

### 路由字段必须分开报

实际签名HAP：

| 字段 | 实际值 |
|---|---|
| unsigned bundle HEADER | `watchapp.nexus.0zzip` |
| signed config `app.bundleName` | `watchapp.nexus.0zzip` |
| profile `bundle-info.bundle-name` | `watchapp.nexus.0zzip` |
| signed config `module.package` | `com.hcbiu.elcton` |
| 手机peer package | `watchapp.nexus.0zzip` |

[A4]为本轮重新解析的字段级证据。**HEADER/app与module.package不同是事实；实际Wear Engine路由依据哪个是未决项，不把静态差异立刻写成唯一根因，不凭猜测改手机peer package。** 源config的app.bundleName也还是 `com.hcbiu.elcton`，签名产物才是 `watchapp.nexus.0zzip`，仅grep源码包名不足以审计实际身份。

## 五、SEND_0、日志缺口及只建议的手机方向

- 冻结 `wearService.js:12–15` 将非数字/缺失的fail第二参数归0；`:99` 仅取 `(d,c)` 中c。原生实际回调若只有一个数字参数、对象形状、或无数字第二参数，都会丢失诊断信息。**不是因为看见0就成功，也不能凭SEND_0还原真实底层206。**[W1]
- `phone-sync.js:148–159` 只有channel open成功后才本地合成HELLO请求主动READY；`:164–167` 发送失败会将detail替换为“回执失败 SEND_*”。因此该字符串可以出现在已经REG之后；再加短环仅6项，缺REG截图不能反推出未注册。[W3]
- 主动READY在手机尚未连接注册时失败，不证明后续HELLO请求READY仍失败；要分别核对同一时段方向。
- 官方FAQ206的多个候选原因：包名/指纹不匹配、表应用不在前台、任一侧未注册接收器、消息为空、蓝牙未连接；该FAQ是排查列表而非对本案唯一归因。[E2]

父任务正进行的 minimal fix（本报告不改）：canonical `SEND_206` 诊断读取两个标量参数、不给raw自由文本，保留REGsummary；这是**观测修复，不等于握手问题已解决**。

手机侧建议仅限待授权后的取证/评估：保留exact native注册成功/失败阶段及当前代际；核对已装APK版本与公开身份；确认READY是否到达Receiver、是否被类型/ASCII/协议拒绝。异步旧Receiver注销与新注册是否有原生服务竞争，目前只有可能性、没有现场时序证明，不自动加延时、不改/CI/安装手机。缺证项目：同时段已装双包版本、实际服务末段SDK版本、PKG/CERT/REG完成回调、手机HELLO发送结果、表HELLO到达、表READY发送真实数值参数、手机READY接纳/拒绝、蓝牙与前台状态。

## 六、hasAvailableP2pService 应怎样判：确认部分与未确认部分

**已确认：** 当前AAR无`Capability`类/该方法，官方Lite JS无该字面量，本项目没有使用它；官方Android可用设备查询名为 `DeviceClient.hasAvailableDevices():Task<Boolean>`。正文原话：“查询是否有可用设备任务执行成功，result值表示是否有可用设备”；定义为“支持Wear Engine能力且与手机侧运动健康App处于连接状态”。[S4、E1]

**不能确认：** 题述 `Capability.hasAvailableP2pService` 的准确所属平台、版本与返回类型合同。本轮官方正文/符号没取得该方法，不声称不存在于所有华为平台；**未获取/官方未提及 ≠ 不支持**。不得用ArkTS `WearEngineCapability.P2P_COMMUNICATION=1` 或Boolean API的结果替换 Android `getP2pCapability()` 的0/1/2语义。

**条件性正确判读（不是该方法已核合同）：** 若另一个SDK中确实存在boolean可用性查询，必须区分“查询成功”与“结果为true”：成功true=可用，成功false=此次不可用，fail/异常=查询失败/未知；不能直接把Android能力0转Boolean得到false，也不能把0赋作“服务尚未建立”。当前项目正确可用性流程仍是connected+能力常量+installed+注册任务+真实HELLO/READY，各阶段单独报告。

## 七、工作副本 HEAD 与差异

全部操作显式路径、git只读使用 `--no-optional-locks`；未commit/push。初始与结束原始状态分别在 `evidence/workspace-initial.json`、`workspace-capture.json`、`workspace-pre-final.json`，最终读回另存 `workspace-final.json`。

| 工作副本（均在 `/data/data/com.termux/files/home/`） | 核查HEAD | 状态 |
|---|---|---|
| we-handshake-repair-20261115-watch | `83d58a8f931848bdf65bb923e5579ff7285a0714` | 初始clean；期间父任务并发修改app.js/phone-sync.js及新增文件。本子任务仅research报告/证据；冻结HEAD取证，不混入并发diff |
| we-ready-receipt-20261114-watch | `83d58a8f931848bdf65bb923e5579ff7285a0714` | clean |
| elcton-wear-realdevice | `9517f345e8d0e0995708b0a5d0b37b4cae8689ac` | 无tracked diff；原有tools/sign/node_modules未跟踪 |
| elcton-wear-sync | `2a8183a537db333df1d3eeb350015dbd99ac71d2` | 无tracked diff；原有.ai-memory/、qa/late_timeout_probe.mjs未跟踪 |
| elcton-wear-install34-20261113 | `0be04ed667392401c6024d892feb6983928c903c` | 无tracked diff；原有qa/install34/.artifact-cache/、tools/sign/node_modules未跟踪 |
| work/elcton-hms-investigation-20261114 | `0e72d9a4d1bd49f01a221e62c679eb2059a52bdc` | clean |
| elcton-phone-release-029-20261114 | `bb26c64b67e1cfa7903cd709c2aac482f6490e6b` | CONTINUATION-R10.md初始6行追加，结束读回为9行追加；本子任务未写手机副本，不能宣称其他并行任务未改文档。手机产品源码无tracked diff |

最终读回时刻：`2026-11-14T16:30:22Z`（CST 11月15日00:30）。所有7个HEAD均未变化；5个其他副本tracked diff保持原状；父修复副本app.js/phone-sync.js并发变动、手机副本CONTINUATION-R10.md从6变9行已如实记录，未回滚、未覆盖。本子任务只写获准research范围。先前“所有其他diff不变”的验证断言因手机文档并发变化失败，随后重新取回精确HEAD/status/diff存入 `workspace-final.json`，不把失败闸门报成通过。

## 八、证据登记（唯一索引，源码使用冻结副本行号）

| ID | 原始来源与章节/符号 | 本报告内证据 |
|---|---|---|
| H1 | git `f8a8d732…:docs/lan-sync-probe.md` §判读结论 | `evidence/history/1009-lan-sync-probe.md:34–46` |
| H2 | git `697ee9df…:docs/pickup-code.md` §站点/真机踩坑 | `evidence/history/1010-pickup-code.md:10–13,44–51` |
| H3 | git `e1f60dda…:entry/…/pages/sync/sync.js` +主动代码WE负搜索 | `evidence/history/1011-0012-sync.js`、`old-active-we-absence.json`（grep exit1=无命中） |
| H4 | 实际git提交时间与紧邻原docs | `evidence/history/commit-history.json`、`1011-0013-pickup-code.md:48–58` |
| H5 | WE文件路径首次入历史 | `evidence/history/first-we-history.json` |
| W1 | 冻结1.1.15 service协商/收发实现 | `evidence/watch-1.1.15/wearService.js:12–15,31–86,89–104` |
| W2 | 无版本兼容与app factory | `evidence/watch-1.1.15/wearChannel.js:7–50`、`app.js` |
| W3 | REG后主动READY、detail覆盖、生命周期 | `evidence/watch-1.1.15/phone-sync.js:148–183` |
| W4 | WE前版固定engine与1.1.15差异 | `evidence/watch-pre-1.1.15/wearChannel.js`、`history/pre-we-to-1.1.15.diff.json` |
| P1 | 手机MCP列表字段生成链 | `evidence/phone-0.2.9/{PhoneRuntime,PhoneActions,WearProbe}.kt`上述行号 |
| P2 | DTO能力默认/连接policy/HELLO与READY状态 | `evidence/phone-0.2.9/{SyncEngine,DevicePolicy}.kt` |
| P3 | 注册前identify、回调代际、send与诊断 | `evidence/phone-0.2.9/WearProbe.kt:86–89,140–208` |
| S1 | 官方AAR Device整数常量与方法类型 | `evidence/sdk/Device.javap.json`、`decompiled-excerpts/Device.java:10–13,118–120` |
| S2 | 官方AAR JSON P2P键与fallback2 | `evidence/sdk/DeviceJsonUtil.javap.json`、`decompiled-excerpts/DeviceJsonUtil.java:58–60` |
| S3 | 官方AAR JSON空/缺/错回传fallback | `evidence/sdk/common.a.javap.json`、`decompiled-excerpts/a.java:158–173` |
| S4 | 官方AAR/Lite JS精确符号审计 | `evidence/sdk/verification.json`、`wearengine-official.js`、`classes.jar` |
| A1 | 精确0.2.9 APK、CRC/SHA/DEX索引、原始签名manifest回执 | `evidence/apk/index-and-identity.json`、`previous-actual-receipt.json`、`*.stdout.bin.txt` |
| A2 | 实际APK选择性反汇编，identify→register顺序 | `evidence/apk/selected-smali/com/hcbiu/elcton/{WearProbe,SyncEngine}.smali` |
| A3 | 实际HAP CMS/profile/EC点及公开双向身份独立复核 | `evidence/apk/public-dual-identity-actual.json`、`verify_public_identity.py` |
| A4 | 实际HAP HEADER/app.bundleName/module.package | `evidence/apk/header-module-routing-unresolved.json` |
| E1 | [官方Android查询可用设备](https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/query-available-wearable-0000001054326166)，本轮官方公开接口code0取回完整正文 | `evidence/official/query-available-wearable-0000001054326166.{raw.json,txt,fetch.json}` |
| E2 | [官方FAQ206](https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/faq-0000001050818031) §手机与轻量级通信错误206 | 父仓原始留档 `qa/p2p-ready-20261114/evidence/official/faq-0000001050818031.txt:105–116` |

官方SDK来源：[Wear Engine Android 5.0.3.301 AAR](https://developer.huawei.com/repo/com/huawei/hms/wearengine/5.0.3.301/wearengine-5.0.3.301.aar)。官方设备查询正文与SDK快照为本机原始证据；本轮copy字节、javap与产物CMS复核不等于新真机运行。失败网页抓取/搜索不充当引文；`capability-lookup`仅为失败查找，不作API合同证据。

**本轮没有重新构建、运行应用、真机发包或确认206消失。结果是历史通道纠偏、能力0语义纠偏、实际双包身份匹配与日志/路由缺口定位。**
