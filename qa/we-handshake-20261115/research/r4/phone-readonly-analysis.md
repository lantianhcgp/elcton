# R4：Android 手机握手/回传路径只读取证

## 0. 范围与结论等级

- 手机仓库：`/data/data/com.termux/files/home/elcton-phone-release-029-20261114`；本轮首次读取 HEAD：`bb26c64b67e1cfa7903cd709c2aac482f6490e6b`。
- 手表仓库：`/data/data/com.termux/files/home/we-handshake-repair-20261115-watch`；首次核对 HEAD：`ff2a1b2858af88887b2132b77bcfce162a60fa48`，分支 `fix/we-handshake-logger-20261115`。
- **只新增本报告与 `phone-readonly-hashes.json`。**未修改手机源码、证据、状态或 Git 索引；未 commit/push、安装、构建或调用设备/MCP/ADB/浏览器。手机仓库最初已有证据目录修改/未跟踪文件，不能声称仓库最初干净。
- 下文 `P/` = 手机 `app/src/main/java/com/hcbiu/elcton/`；`S/` = 手表 `qa/we-handshake-20261115/research/evidence/sdk/`；`W/` = 手表 `entry/src/main/js/MainAbility/common/`。所有行号来自此次实际读取的工作树文件，不是旧版截图。
- **A 已证实**：此次读取的源码、SDK 类字节及实际命令结果。**B 条件推论**：以该源码确为现场安装版本、同一次操作为前提。**C 待验证**：缺少手机运行回执/实际安装身份/官方服务侧说明，不定根因。

### 核心结论

1. **A：`sync_connect` 没有调用 Android SDK `connectChannel`。**当前应用生产源中 `connectChannel` / `disconnectChannel` 命中均为零；`SyncTransport` 根本无此接口（`P/SyncEngine.kt:12-20`）。实际路径是 **安装检查 → SDK registerReceiver Task 成功 → HELLO send → 等待合法 READY**（`P/SyncEngine.kt:162-213`）。所核验 Android `5.0.3.301` SDK 的 `P2pClient` 公共方法及全部 280 个 class 字节也没有这些符号。因此不能把 `sync_connect` 受理或 HELLO 到表叫作“connectChannel 成功”；也不能据此断言服务内部不存在通道动作。
2. **A：`accepted=true` 不是准备成功。**工具说明明确如此（`P/PhoneMcpTools.kt:9`）；运行时返回 `state=pending`（`P/PhoneRuntime.kt:76-82`）。唯一握手成功转换是有效 READY 被当前代次处理且 `awaitingReady=true`（`P/SyncEngine.kt:247-255`）。
3. **B：同次操作表端 HELLO ×4 证明手机→表应用入站至少到达四次；不证明表→手机可投递。**按本源码，HELLO 只能从当前接收器注册成功分支启动，故同版本/同操作关联成立时，也间接说明该分支执行过；不等于已经采集了手机端注册成功日志或 SEND=207 回执。
4. **A：手机遥测确有关键盲点。**没有注册成功事件、send Task 成功事件、HELLO onSendResult 完整事件、原生接收入口/丢弃原因或协议校验拒绝原因。无 READY 时，现有诊断不能区分“手机从未收到”与“收到后被拒绝/过时代次丢弃”。
5. **证据纠偏：不把 `210301031` 用作真机/native 错误码。**父任务已证明 `mwh5okyh-1` 为 HOST fixture：cursor1413..1424 对应 R3 cloud-canonical-collector readback，seq3 带 `WE-HOST-HTTPS-9eb9af98edcfb02f`；不是 FIT3 原生报错。此数值不参与根因判断。`code=206 type1=0 type2=0` 也不能直接解读为服务原生返回 206：当前表端包装器在进入 fail 分支时自行填 206（见第 6 节）。

## 1. 前置条件、所有者与 sync_connect 的精确路径

| 环节 | 实际动作与约束 | 文件:行 |
|---|---|---|
| 同一 runtime | Application lazy 创建唯一 PhoneRuntime；诊断工具把动作交给 `phone.mcp`，没有另建传输状态 | `P/ElctonApplication.kt:10-17` |
| 同一 engine | PhoneRuntime 构建 WearProbe，再将 `adapter.engine` 注入 PhoneActions；SDK 使用 applicationContext | `P/PhoneRuntime.kt:11-19`；`P/WearProbe.kt:20-24,42-66` |
| 工具参数 | `sync_connect` 只接受非空且长度 ≤256 的 `device_id`，未知工具/异常分别映射为工具错误 | `P/PhoneMcpTools.kt:22-43` |
| MCP 执行 | 必须 enabled；HTTP 工作线程经 MainThreadActions 调度到 Android 主线程，超时/取消不伪造完成 | `P/PhoneRuntime.kt:71-82`；`P/MainThreadActions.kt:22-46` |
| 动作选择 | runtime 必须非 pickupBusy；PhoneActions 要求 ID 在已扫描设备列表中，然后调用 SyncEngine.connect | `P/PhoneRuntime.kt:30`；`P/PhoneActions.kt:11-14` |
| 授权/扫描先行 | `sync_connect` 本身不扫码、不弹授权。扫描路径检查 DEVICE_MANAGER；非交互缺权限时停在“需要设备授权”；交互只使用可见 Activity 弱引用 | `P/SyncEngine.kt:105-141`；`P/WearProbe.kt:91-112` |
| 真实设备数据 | `commonDevice` 把 UUID/name/model/isConnected/p2pCapability 复制到 SyncDevice/native 映射；空 UUID 不进入列表 | `P/WearProbe.kt:115-138` |
| 能力门槛 | closed/busy 拒绝；设备必须已连接，p2p=1 明确不支持则拒绝；未知能力值仍允许探测，不等于已认证支持 | `P/SyncEngine.kt:162-169`；`P/DevicePolicy.kt:3-6` |
| 清理旧会话 | unregister、取消 timer、清总截止、作废 sendAttempts、awaitingReady=false，随后增加 engine generation | `P/SyncEngine.kt:170-174` |
| 安装检查 | 15 秒窗口；identify 后 `isAppInstalled(selected, watchPackage)`。成功且 installed=true 才设置 peer | `P/SyncEngine.kt:175-184`；`P/WearProbe.kt:140-147` |
| 注册 | 再给 15 秒窗口；transport.register 的成功回调经 scheduler.post 验代次/closed/registering，才设置 awaitingReady=true 并 hello | `P/SyncEngine.kt:185-200` |
| 立即返回 | `connect()` 返回 true 是启动异步流程；安装或注册随后仍可能失败 | `P/SyncEngine.kt:201-204`；`P/PhoneRuntime.kt:76-82` |

安装查询不能验证签名或对端是否活跃：所读 SDK 的 `isAppInstalled` 是 `getDeviceAppVersionCode(...) != -1`（`S/decompiled-excerpts/P2pClient.java:153-160,560-565`）。源码没有 ping、单独“连接通道成功”回调或实时连接重查；`pairing_state` 的设备事实也是最后扫描结果（`P/PhoneRuntime.kt:96-100`）。

## 2. 对端包/签名与 SDK registerReceiver

### Android 发往手表/接收来自手表的同一配置

- 目标包固定 `watchapp.nexus.0zzip`；固定 fingerprint 是 `watchapp.nexus.0zzip_` 加证书 EC 点 Base64，**不是 Android 证书 SHA-256**（`P/WearProbe.kt:86-89`）。完整原值保存在源文件及其 SHA-256 绑定，不在此重复长标识。
- `identify()` 在 installed 与 register 前分别执行（`P/WearProbe.kt:144-145,167-168`）；send 不重新 identify，使用同一 lazy p2p 的字段（`P/WearProbe.kt:23,199-207`）。这不是每包显式 Peer 对象，也没有应用侧其他调用者的生产调用点。
- SDK `setPeerPkgName`/`setPeerFingerPrint` 只写两个字段（`S/decompiled-excerpts/P2pClient.java:514-522`）。register(Device, Receiver) 的后台任务计算手机真实 packageName 与安装证书指纹，构造本地 IdentityInfo 和上述对端 IdentityInfo（`:67-79,548-550`）；服务返回整数 0 才使 Task 成功（`:75-79`）。
- SDK register 下传到服务时携带设备、本地/对端 IdentityInfo、receiver identityHashCode；byte[] 回调经 Message.Builder 包装后转发到应用 Receiver（`S/decompiled-excerpts/P2pClient.java:614-630`）。**本层只能证明请求被服务接受，不能证明表→手机链路已经成功穿过服务。**服务具体匹配规则未反编译/未运行验证。
- Android `Receiver` 方法只有 `onReceiveMessage(Message)`；本应用此回调没有发送者包/签名参数可核对。包/签名的路由约束在 SDK/服务层；JSON `sender=watch` 是协议字段，不是平台来源认证。

### 反向目的地与身份边界

仅为跨端边界对照，实际读了冻结的表端源：`W/wearIdentity.js:3-4` 为手机包 `com.hcbiu.elcton` 与证书 SHA-256 `fc08a0b474a8ffca5887bd5c88ac15e865a63a64eca81c10f344496c46d9ad94`；表端 setPackageName/setFingerprint 与 sendMsg 目的地使用它（`W/wearService.js:38-48,108-109`）。手机 build applicationId 也为该包（手机 `app/build.gradle.kts:8-15`）。

既有 `research/evidence/apk/public-dual-identity-actual.json:2-24` 记录的是 **1.1.15 公开产物**及对应旧 APK 的身份匹配，并明确不是固件接受/已安装包证据。本轮未打开私钥、未校验现场安装 APK/HAP，故不把旧产物匹配升级成“1.1.16 现场身份必然正确”。同样，手表工程源 config 的开发 bundle 不等于签名安装身份。

## 3. NativeReceiver → READY 的逐层过滤与静默出口

1. **原生代次/类型**：WearProbe.register 先 unregister；生成 receiver，将 NativeRegistration 先存入 registration，再请求 SDK（`P/WearProbe.kt:150-168`）。回调必须 `registration.generation == generation && nativeGeneration == generation`，且 `packet.type == MESSAGE_TYPE_DATA`（`:155-157`）。不满足直接丢弃，无记录。
2. **原始字节**：data 非 null，≤1024 字节，所有 byte.toInt 位于 32..126 才 ASCII 解码后转发（`:158-161`）。换行、NUL、非 ASCII/直接 UTF-8 汉字、文件类型均无记录地拒绝；空 byte[] 在这里能通过，随后被协议入口拒绝。
3. **引擎代次**：register 传入的 message 闭包通过 `main(gen)` 调用 onMessage（`P/SyncEngine.kt:188`）；main 再检 closed 和 generation（`:89-91`）。取消、重连、超时后的消息可能在此丢弃。
4. **协议验证**：`PacketIngress.watch(raw)` 返回 null 则静默 return（`P/SyncEngine.kt:215-218`）。严格要求可打印 ASCII/≤1024、`protocol="elcton.sync"`、数值 version=1、`sender="watch"`、字符串 type 与 transferId；不是字符串数字等可强转值（`P/PacketIngress.kt:12-23`）。
5. **READY 必需字段**：maxBytes 1..32768 整数；sourceRevision 0..9007199254740990 整数；datasetId 字符串≤64；digest 空或 8 位小写十六进制；localDirty/hasData 是真正 Boolean。transferId 必须为字符串，空允许，非空则匹配 `[A-Za-z0-9_-]{1,40}`（`P/PacketIngress.kt:18-26`）。缺字段/类型错/JSON 异常无错误日志（`:35-36`）。
6. **应用状态窗口**：只有 type=READY、session=null、awaitingReady=true 才清 timer、使 sendAttempts 作废、ready=true/busy=false，填充远端元数据（`P/SyncEngine.kt:247-255`）。导出有独立分支和 transferId 校验（`:219-245`）；不在等待窗口的 READY 不会立刻建立准备态（`:247,256`）。因此注册成功状态尚未经主线程发布前的主动 READY、取消后的 READY、重复 READY 都不能被当作完成证据。
7. **准备 ERROR**：校验合法的无 transferId ERROR，只在 awaitingReady 且无 activeTransfer 时使握手失败（`P/PacketIngress.kt:7-10`；`P/SyncEngine.kt:218`）。

这里的 `registerReceiver` 是 **Wear Engine Receiver**，不是 Android BroadcastReceiver。`McpKeepAlive.kt:144-159` 的动态 BroadcastReceiver 仅处理通知阻止/STOP，与 P2P 收包过滤无关；应用 manifest 没有为 READY 定义广播 intent-filter（手机 `app/src/main/AndroidManifest.xml:11-17`）。不应以增加 exported 广播接收器“修 READY”。

## 4. HELLO / SEND 与本地 ready 的意义

- HELLO 文本为 `{"protocol":"elcton.sync","version":1,"sender":"phone","type":"HELLO","transferId":""}`（`P/SyncEngine.kt:212`；`P/Wire.kt:35-36`），不是课表，也无握手交易 ID。
- 先设 5000 ms deadline，再 send；首次加最多三次重试，对应最多四个 HELLO。最后 fail“未收到手表准备回执”，清 ready/peer 并注销接收器（`P/SyncEngine.kt:206-213,100-103`）。时间安排不依赖每个成功发送回调，因此 **看到 HELLO ×4 不等于已经看到四次 SEND=207**。
- WearProbe 用 `Message.Builder().setPayload(ASCII bytes)` → `p2p.send(selected, message, SendCallback)`；onSendResult 只把整数交给 engine，progress 空实现；只订阅 Task failure，**没有 Task success 观测**（`P/WearProbe.kt:199-208`）。
- SDK 此 send 重载使用手机安装身份+配置的手表身份，服务调用非零抛异常，Task 请求成功与 SendCallback 是不同边界；回调结果被原样转发（`S/decompiled-excerpts/P2pClient.java:230-245,365-399,494-496`）。
- Engine 只接受当前 generation 且最新 sendAttempts 的结果；code≠207 才业务失败，207 只通知 session.transportSucceeded（`P/SyncEngine.kt:339-355`；`P/SendAttempts.kt:4-8`）。迟到的旧 HELLO 结果可能被新 attempt 或 READY 作废，没有观测记录。
- 207 不置 ready、不证明保存；TransferSession.transportSucceeded 明确为空，只有对应应用 APPLIED 才完成保存（`P/TransferSession.kt:37-45`；`P/SyncEngine.kt:260-266`）。手机 ready 是“当前有效 READY 已通过协议入口”，不是设备 connected、工具 accepted、安装查询成功、接收器注册成功或发送成功。
- PhoneActions.stateJson 输出 ready/status/detail 等，但没有 receiver 注册状态/代次、awaitingReady、HELLO 次数、onSendResult 历史、connectChannel 字段或 diagnostic 原文（`P/PhoneActions.kt:42-48`）。

## 5. 取消/生命周期能关闭反向接收，但未证实此次发生

- WearProbe.unregister 先 nativeGeneration++/scanGeneration++，registration=null，再异步释放旧 receiver；迟到注册成功只 release 该精确 receiver，避免全局注销新接收器（`P/WearProbe.kt:169-177,186-196`）。未等 unregister Task 成功才继续，且成功/耗时不记录。
- **SDK 注册成功的精确含义已由本轮 javap 字节码复核**：`registerReceiver(Device,Receiver)` 返回 `Task<Void>`，Callable 将服务 registerReceiver 的整数返回值 0 转成 null/Task success，非零抛 WearEngineException（`S/decompiled-excerpts/P2pClient.java:67-79,548-550,614-630`）；不是 SEND=207，也不是表端 `isRegister` 事件。SDK 对本地 Binder 连接会按需检查/获取，不能因未显式 connectChannel 就认为请求没到服务。
- **清理不是无参全局退订**：SDK unregisterReceiver 针对传入旧 Receiver 的 `System.identityHashCode` 调服务，返回 0 才 Task success（`S/decompiled-excerpts/P2pClient.java:119-139`）。所以旧 callback 的 release 没有源码证据表明会直接注销新 Receiver；服务端是否按该 ID 精确隔离未取证。异步 unregister 与 register 不构成应用层等待序列，保留为 C 类时序假设，不把它报告成已发现的全局清理错误。
- **同一 P2pClient 身份字段**：本轮 javap 确认 HiWear.getP2pClient(Context) 返回 P2pClient.getInstance；后者静态单例（`S/decompiled-excerpts/P2pClient.java:18-24,348-362`）。本应用生产源的 getP2pClient/identify 只有 WearProbe 调用点，固定 peer 身份没有不同设备的重写值。手机路径没有 FeatureAbility 或 `releaseConnection` 调用；表端无参 unsubscribeMsg/FeatureAbility 是另一设备/进程侧边界（`W/wearService.js:18-21,56,88-90`），不能假定共用一个 Android P2pClient 或直接撤销手机注册。
- engine fail/cancel 都作废业务代次并 unregister（`P/SyncEngine.kt:100-103,325-332`）。receiver/native 与业务 generation 是两层独立防旧包机制。
- Activity.onStop 调 PhoneRuntime.onBackground；若 McpKeepAlive.active=false 才 cancelAll；onDestroy 只撤观察者，非传输所有者（`P/MainActivity.kt:535-536`；`P/PhoneRuntime.kt:35-46`）。MCP enabled 偏好与 active 实际 FGS 状态不是同一事实。
- STOP 明确 cancelPhoneIfInitialized；通知丢失 suspendSession(cancelSync=false) 本身不主动 cancelSync，后续 onBackground 且 active=false 才可能取消；Service.onDestroy 把 active=false（`P/McpKeepAlive.kt:78-109,214-227`）。
- 所以“退后台注销接收器”是可检验的候选，不是已发现的现场根因。本轮不改 KEEP_ON/FGS/生命周期或 logger/common/UI。

## 6. 现场/fixture 数字的边界

既有聚合文件 `research/r4/watch-real-sessions.json` 同时含 `mwh7l2un-1` 与 `mwh5okyh-1`；**文件名不能替代来源验证**。父任务现已证明后者为 HOST cloud-canonical-collector 的 cursor1413..1424；本轮又实际读取 `qa/we-handshake-20261115/compiled-logger-https.mjs:145-159`：环境标为 HOST_HTTPS_NOT_FIT3，`:159` 直接注入 `SEND_FAIL` 的 `arg1=210301031`，这属于测试数据而非原生错误。真实会话 `mwh7l2un-1` 的来源按父任务确认使用；本轮机械统计其 HELLO_RECV 4 条、READY_FAIL/SEND_FAIL 各 5 条。首次 READY_FAIL 是 HELLO 前主动准备的失败，不能直接把 5 次失败写成 5 次 HELLO。例如 seq17 在 `watch-real-sessions.json:259-272`，首次 HELLO seq18 在 `:275-289`，其后失败 seq21/22 在 `:326-357`。本轮不另行调用 collector。

尤其当前 `W/wearService.js:99-109`：`fail(d,c)` 先执行 `finish('SEND_206',d,c)`，再把 206 作为日志包装层 code；`W/wearTrace.js:13-16,39-46` 的 type=0 代表 undefined。故 `code=206 type1=0 type2=0` 已证实的只是 **fail 分支执行，两个原始回调参数均 undefined**；没有实际原生 arg1/arg2 供解码。这不否认 fail，而是防止把包装器常量当详细服务错误。

`210301031` 已确认属于 HOST fixture，不作为 BLE/鉴权/通道故障类别证据，不猜含义。官方错误码解码归父任务。

## 7. 候选问题排序与可证伪条件（未实施测试）

| 优先级 | 候选/当前解释力 | 当前确定性 | 将来最小区分证据 |
|---|---|---|---|
| 1 | **反向发送/路由或服务投递边界失败**：手机→表 HELLO 到达，表发送 READY fail；反向身份/路由/服务会话仍可能不成立 | B 条件推论；没有原生原因码，不指认具体身份/固件 | 同一 connect epoch 的手机 REG_TASK_OK、注册仍当前、RX_ENTER 计数及表 fail 时间；若手机 RX_ENTER 确无对应 READY，才把问题收窄到应用接收入口前 |
| 2 | **接收器已被超时/取消/后台清理，或异步注销/注册时序导致旧回执** | C；源码有合法关闭路径，无现场生命周期记录 | REGISTER/UNREGISTER 请求及 Task 回执、nativeGeneration/engine generation、active、取消原因时间线；若 fail 时注册已关闭则解释成立，否则降权 |
| 3 | **手机收到但被类型/字节/JSON/字段/代次过滤** | A 存在静默拒绝点；C 未见现场包 | RX_ENTER→BYTE_ACCEPT→PACKET_VALID→READY_ACCEPT 或对应枚举 DROP_REASON；若完全无 RX_ENTER，则不能归因 PacketIngress |
| 4 | **装机包/签名身份与配置不一致** | C；旧公开 1.1.15 产物曾匹配，不覆盖此时安装态；HELLO 成功也不验证反向接收身份 | 经批准取得实际 APK/HAP 的公开身份和精确安装版本，对照 `WearProbe.kt:86-89` / `wearIdentity.js:3-4`，不触碰私钥 |
| 排除误读 | **“缺 connectChannel 所以补一个必修好”或“accepted=true 即全通”** | A 当前 SDK 无该公共符号，当前受理不是完成；不是可直接实现的修复 | 若父任务官方版本资料证明需新 SDK/另一客户端的通道 API，另开行为变更设计；不在日志补丁混入升级/重连策略 |

先定位 **首次反向失败在手机 RX_ENTER 前还是后**。不要同时改 SDK、指纹、发送格式与生命周期后再把现象改善归因某一项。

## 8. 具体 phone-only 日志补丁提案（仅提案，需用户另行批准）

采用隔离日志变更，不改协议、过滤、时限、SDK版本、回调顺序、generation/锁、注册/注销次数、KEEP_ON、文件课程数据或 UI。

1. **WearProbe installed/register/unregister 边界**（`:140-197`）：新增有界事件 `APP_QUERY_CALL/RESULT`、`REG_CALL/TASK_OK/TASK_FAIL`、`UNREG_CALL/TASK_OK/TASK_FAIL`。字段限本地 connect epoch、native generation、receiver 本地编号、elapsedRealtime、设备本地匿名编号、public identity hash/配置摘要及 current/stale。先记录回执再保持现有 current 判断；过时 failure 也可记录，但不调用新的业务失败路径。
2. **SEND 请求与结果**（`:199-208`）：枚举协议 type、字节数、epoch/attempt；分开记 `SEND_TASK_OK`、`SEND_TASK_FAIL` 和 **所有** `SEND_RESULT(code)`，包括会被旧 attempt 丢弃的回调。成功日志不代表 READY/保存，不应改变原结果传递；新增 Task 成功 listener 必须是纯观测。
3. **接收入口与现有丢弃判据**（`:155-162`）：在业务判断前记录 RX_ENTER 的 type、data-null、length、current；随后仅以现有条件生成 `STALE_NATIVE/NOT_DATA/NULL_DATA/TOO_LARGE/NON_ASCII` 枚举。不额外读取不安全 getter/不 stringify Packet/异常，不记录原始 JSON、课程、UUID/序列号/私密文本。
4. **引擎/协议接纳**（`P/SyncEngine.kt:89-91,188,206-218,247-255,339-355`）：记 `HELLO_ATTEMPT`、`STALE_ENGINE`、`PACKET_REJECT`、`READY_OUT_OF_WINDOW/READY_ACCEPT`、timeout/cancel 原因、SEND callback current/stale。PacketIngress 若需更细拒绝原因，只在原判断点附加纯观测，不另做一次解析或放宽字段；此项需零行为回归测试。
5. **独立有界 handshake 日志**：现有 WearErrorRecord/ErrorJournal 是异常记录而不是全事件流；不能把 207/READY/字节丢弃伪装成异常。提议独立小容量环/JSONL，保留 SDK 完整异常原通道与四个诊断工具语义。若暴露读取，需显式新工具或白名单批准，不暗改现有 fs_read 允许范围。
6. **不混入生命周期修复**：只在 onBackground/cancel/fail 当前执行点记 active/原因；不为了收日志自动 connect、扫码、启动 FGS、延长 5 秒窗口或修改守护策略。

观测写失败必须吞掉且不阻断业务；日志有固定长度/事件上限，异步落盘不在 SDK 回调上增加重 I/O。验证应覆盖正常、SDK Task 失败、整数 SEND 失败、迟到回调、原生字节拒绝、非法 READY、取消/超时，并断言原 SDK 调用序列/业务结果不变；本轮没有编写或运行这些变更测试。

## 9. 现有日志能保留什么、缺什么

- WearProbe.describe 采集异常链与 WearEngineException.errorCode，写 `Log.w(ElctonWear)`、DiagnosticRuntime.record，并更新 engine diagnostic；内部观测异常被保护（`P/WearProbe.kt:211-229`）。SDK Task/synchronous 异常走此路径，**SendCallback 整数结果不走 describe**（`:205`）。
- DiagnosticRuntime.record 写 latestError、错误 phase、异常 journal（`P/DiagnosticRuntime.kt:86-99`）；observe 只更新 status/detail/ready/busy/deviceCount/timestamp，不推进 phase（`:77-83`）。初始 phase=idle 或旧错误 phase 不是当前安装/注册/HELLO 阶段；启动还可能恢复前次 lastError（`:16-17,38-40`）。
- ErrorJournal 保留至多 128 条完整异常，原子替换，不是逐阶段传输日志（`P/ErrorJournal.kt:11-36,43-51`）；WearErrorRecord 保存异常 type/message/code/causes，不含 receiver/attempt/peer（`P/WearErrorRecord.kt:36-56`）。
- error_tail/diag_read/version_info/fs_read 仅暴露错误/状态；fs_read 白名单只有 `diagnostics/wear-errors.jsonl` 与 `diagnostics/state.json`（`P/DiagnosticTools.kt:20-27,49-59,93-95`）。本轮仅读实现，不调用这些工具。
- 因此“错误尾部为空/只有旧错误”“phase=idle/旧 phase”“SEND 207 没出现在 error_tail”都不证明没有注册、没有 HELLO 或已经收到了 READY。超时/SendCallback 非207 通常只有当前 status/detail，由 observe 覆盖更新，缺少持久事件相关性。

## 10. 读取与实际验证清单

- 只读扫描范围为手机 `app/src/main` 全部常规文件，加 `app/build.gradle.kts`；逐个 SHA-256/字节数/行数列于同目录 `phone-readonly-hashes.json`，包括仅参与符号扫描而未逐行解释的文件。文件名发现不算内容读取；Git 自动读取的仓库元数据另由命令/状态快照描述。
- `app/libs` 和本机 `~/.gradle` 均不存在；没有偷偷下载/安装 SDK。复用了手表已有 classes.jar，以及 Documents 官方 SDK 快照 `android-aar.zip`。本轮实际重算 AAR SHA-256=`97adb85c1092c8b9660b7d26eb7a0bccb162201f1eea1f85373a7f59e827d2ca`，其 classes.jar 与已有 jar 同为 `b0cc167e7bd6324ba47fc8e4f2668793d5c19e4640a96eed45d17b86d5c3b8ef`。
- SDK Manifest 表明 versionName=`5.0.3.301`、versionCode=`50003301`、sdk.api_level=12（`S/AndroidManifest.xml:3-5,12-14`），与手机 Gradle 依赖 `app/build.gradle.kts:50` 一致。实际 `javap P2pClient Receiver Message Message$Builder` 成功，确认接口/重载；全部 class 字节扫描无 connectChannel/disconnectChannel。
- 手机首次 Git status 非空，仅为既存 qa 证据目录项目；只读检查生产路径的 `git diff --name-only -- app/src/main app/build.gradle.kts` 无输出。哈希清单附前后 status 摘要及此次产物写入窗口的文件哈希复核；不声称对系统 atime 或并行其他任务建立了全盘无变化证明。
- 这是静态证据报告，不是连接修复或现场验收结果。没有手机现场日志，故目前不能在身份路由、接收器生命周期、SDK服务层与协议拒绝之间定唯一根因。
