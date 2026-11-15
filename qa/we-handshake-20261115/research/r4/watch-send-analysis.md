# R4 独立表侧 send/READY 路由审计（只读）

## 结论 / 证据范围
- **未发现可定位为当前 READY 原生失败根因的表侧 JS 路由回归；不建议盲改。** 已核对实际指定 HAP 的工厂绑定、唯一 channel、版本/配置/注册屏障、sender/peer、官方 5.0.2.306 send 字段。
- 本次只读本地文件和离线 VM；未使用设备/MCP/ADB、网络、浏览器、CI、签名、安装或真实 send。仅新增本报告及 `watch-read-hashes.json`。
- 仓库 HEAD：`ff2a1b2858af88887b2132b77bcfce162a60fa48`；HAP 编译来源 `cbd171553e70eb614ca4283534915b92ebb870de`。上述提交之间受审的 app/service/channel/compat/identity/phone-sync 路由源码无 diff。
- 指定“已装包”只能以父任务提供的安装归属采信；本次重新读的是 `/storage/emulated/0/haps/elcton-20261115-WE分阶段日志常亮-1.1.16-cbd1715.hap`，**没有独立从表内拉取在运行文件**。不能据此宣称固件实际装载字节已重新取证。
- 路径简称：`S=entry/src/main/js/MainAbility/common`，`P=entry/src/main/js/MainAbility/pages/phone-sync/phone-sync.js`，`Q=qa/we-handshake-20261115`。以下行号均为真实文件行号；编译单行文件另给 module/offset/hash。

## A. 唯一真实 SID 与时序
- 仅分析 `mwh7l2un-1`：36 条已取得记录，cursor 1425–1460，seq 1–37（缺 seq15）。`Q/research/r4/watch-real-sessions.json:2-613`。
- `VER_OK service=402 v0=5 v1=0 v2=0 v3=402` → `BUS_NATIVE` → `PKG_OK` → `CERT_OK` → `REG_OK` → 初始 `READY_PREPARE`；分别见同文件 `:101-237`。
- HELLO 4 次、READY_PREPARE 5 次、READY_PREPARED **实收4次**、SEND_FAIL/READY_FAIL 各5次；未观察到 READY_OK/SEND_OK。初始 READY 的 PREPARED 记录缺失，不补造。
- REG 到初始 SEND_FAIL 954 ms；REG 到首个真实 HELLO 101490 ms；4 次 HELLO 到对应 SEND_FAIL 为 192/201/219/197 ms。后来不是只发生在初始化紧邻窗口。
- 5 对失败均 `code=206 type1=0 type2=0`（同文件 `:254-272,339-357,424-442,509-527,594-612`）。`S/wearTrace.js:13-16,39-46` 定义 0=undefined；`S/wearService.js:101,108-110` 在原生 fail 分支主动包装 206。**206 不是读到的底层业务错误码，两个原生回调参数没有提供诊断值。** catch 则返回 SEND_UNAVAILABLE，不会生成此 206。
- 排除 HOST SID `mwh5okyh-1` 和其注入值 210301031；已有完整12行 marker 对齐证据 `Q/research/r4/session-origin-proof.json:2-13,15-98`。本审计无任何把该值用于表侧根因的结论。

## B. 官方与 canonical 源码对照
| 项目 | 当前实际路径 | 原始官方 SDK 对照 / 结论 |
|---|---|---|
| 版本请求 | `S/wearService.js:77-91`：sdkVersion='3'，402→bus=engine | `Q/research/official-sdk-5.0.2.306.source.txt:59-72,298-315`：同一 >=401 native 路由 |
| 配置 | `S/wearService.js:35-49`：setPackageName.complete→setFingerprint.complete→subscribe | 官方 `:82-128` 同 appName/appCert 字段；当前增加确定屏障，不是在未配置时就 send |
| 注册 | `S/wearService.js:52-72`：同 bus 先 unsubscribe，再 subscribe；空数据/isRegister 才 open+negotiated | 官方 `:196-246` 同 native unsubscribe/subscribe 及注册回调形状。官方 registerReceiver 额外再 setPackageName；当前只配一次且等待 complete，没有证据证明必须重复设置 |
| 文本发送 | `S/wearService.js:95-110`：ascii；open/bus/<=1024 门禁；bus.sendMsg | 官方 `:276-306`：deviceId='remote', bundleName=peerPkgName, abilityName='', message=getData(), success/fail；**六个字段一致** |
| 错误包装 | 当前 `:99-110` fail→SEND_206；不因 send fail 关闭 channel | 官方 `:288-296` 任意 fail→206，未区分底层 code；无参 fail 也会包装206 |

原始 ZIP 内 wearengine.js 与 source.txt/evidence SDK **字节一致**，SHA256 `8c7f1100c840abdb237991b0d436ef9ab49a215269c5fecdb3dd59fe63a71471`。不是另一个网上示例。

## C. HELLO/READY 使用同一 channel；准备顺序
- `P:109-115` 只在 onListen 分配一次 `this._channel=makeChannel(identity)`，随即 open；`P:137-140,178-184` 收到 HELLO 的异步结果通过 **同一个 self.reply→this._channel.send** 回发，没有在 READY 路径创建新实例。
- 初始化“本地 HELLO”是 `P:162-175` 中 **注册成功后** 驱动 receiver 做 readiness 查询，不是伪造真实 HELLO_RECV；它的 response 也走同一 reply。
- `S/wearReceiver.js:11-13,35-58`：只接 sender='phone'；storage.load 成功后才 answer READY，sender 明确为 **watch**。异步响应受 page gen/closed 守卫 `P:116,138,163,169`；替换/关闭发生在 `P:187-201`。
- `S/wearService.js:63-71`：只有注册门禁打开后才交付 JSON phone 消息；send 取 closure 的同一 bus。REG 前 HELLO 会被忽略，不能触发 READY send。
- **离线实际编译字节 VM 已执行两组**（原始字节载入，不改盘；仅临时替换内存 trace 为收集器、不调用 app.onCreate；system.fetch/write 被禁）：同步及延迟逐级完成 VER/PKG/CERT/REG，402；一条初始查询加4个 HELLO；均 factory=1、五条发送同 channel/engine、sender=watch、READY、remote/com.hcbiu.elcton/空 abilityName、207字节 ASCII、<=1024；无参 fail 得206/type0/type0；销毁后0 timers。
- 延迟组 VER/PKG/CERT/REG 未完成及 REG 前 HELLO阶段：send_count均0，negotiated=false；REG 后初始1条，4个HELLO后5条。官方 SDK 离线无参 fail 对照亦得206和 undefined errorMessage。
- 这些是 **HOST adapter 的语义检验，不是原生可发送证明**。真机单次 REG_OK/四次后续HELLO支持同一订阅持续有效，但日志不含 native 实例指针，不能独立证明原生内部 tunnel 对象。

## D. 实际 HAP 绑定 / 身份 / 编译来源
- 新读 HAP：900659字节；SHA256 `1d013924b2f2123b67f63926cc641bbf7e4fd9468db53e2ab2a4b04792d87f9a`，与 `Q/evidence/r3/delivery-identity.json:3-10` 精确一致。signed.bin 有界解析至 unsignedEnd=893808，28个文件，7个JS，**0个.bc**。
- `assets/js/MainAbility/app.js:1` 的 webpack module **622** 定义 canonical service，module831 把 `_elctonWearChannel:_wearService["default"]` 绑定到622；`_elctonWearChannel` 字节offset17375。service中的 bus=engine 在offset12385附近。不能把先出现的 legacy sendMsg 文本命中误认成生产分支。
- `assets/js/MainAbility/pages/phone-sync/phone-sync.js:1`：offset13490 导入 `requireModule('@system.wearengine')`，requireModule 实际调用 requireNative(moduleName.slice(1))；offset13730 委派 app._elctonWearChannel(identity,protocol,engine)；offset41669 reply 调用 this._channel.send。**页内sendMsg=0；transport在app，不是丢失绑定。**
- 实际 app SHA256 `b568c9988155357dc2c86d61ed2b77b311b0419f8ecfd52214e91f0bf0109377`，页 `196ff66d8a6aa7788283233071a1d5d0fee7f34e3b1473150eb86b0cb8b1292d`。
- 原始 CI APP→配置 APP仅app.js/app.js.map不同；配置APP→指定HAP仅config.json不同，**七JS及其他资源逐字节相等**。canonical module622原始/配置/签后相等，5826字节，SHA256 `52a3b5a52828cbc1c2584aa560f5f3140d99a84540b618469e43fc93dc3f4b33`；不是 logger 注入改坏 service。旧 parse-only 七JS rc0 是 `Q/evidence/r3/shared-exact-native.json:8-64` 既有证据，本次未重跑，不等于 native transport 验收。
- `S/wearIdentity.js:3-4` 和实际页offset17129：peer手机包 `com.hcbiu.elcton`；证书指纹 `fc08a0b474a8ffca5887bd5c88ac15e865a63a64eca81c10f344496c46d9ad94`（64位无冒号）。与既有精确APK signer证据 `Q/research/evidence/apk/elcton-phone-probe.apk.signer.stdout.bin.txt:9-10` 一致；**本次没有确认当前运行手机APK或云端登记指纹**。
- 实际签后 HEADER/config app/profile bundle均 `watchapp.nexus.0zzip`，module.package=`com.hcbiu.elcton`，version1000119/1.1.16；profile经stdin OpenSSL CMS验证成功，profileSHA `29675fba03bc5be63ba4072c4ab0daec58090c9df3447496b52892c6dd0c764e`、leafSHA `8926257d1bd9ff653dcd84100d53cbbabbd39371fdda5126dfb37429e55c67be`，均与1.1.15既有身份记录一致（`Q/research/evidence/apk/public-dual-identity-actual.json:4-18`）。本次未重新跑完整HAP CMS hash-binding；既有强验证 `Q/evidence/r3/shared-strong.json:24-45` 与新读HAP哈希绑定。
- 原始 APP app.bundleName 为com.hcbiu.elcton；签后改为profile bundle且module.package保留。这个 **双identity静态差异真实存在，但是否参与固件 outbound route 未证明**；手机→表 HELLO 能到、历史同配置不是双向发送通的充分证明。不把它直接叫根因。

## E. 已排除的代码层假设与残余边界
**对指定字节及已见SID可以排除/显著削弱：**
1. 402误走FeatureAbility/no-version compat；实际 BUS_NATIVE和factory/module622均一致。
2. READY建第二个channel、改用错误engine；page唯一分配/同reply路径/实际字节VM均反证。
3. VER/PKG/CERT/REG完成前就发；逐级屏障及延迟VM反证。不能排除native complete仅表示受理、内部尚未就绪，但101秒后重复失败削弱单纯短初始化竞态。
4. 当前回包sender写成phone、send目的使用watch bundle、abilityName非空、deviceId非remote；actual字段/源码明确反证。初始本地HELLO.sender=phone是receiver输入，不是回包。
5. READY根本没有准备到或被闭锁/长度门禁挡掉；四次实际READY_PREPARED且带206的原生fail只在sendMsg fail分支产生。真实payload bytes未记，但调用发生已跨越ascii和<=1024门禁。
6. 签包配置改变canonical service或JS-only包暗藏不一致BC；module622及七JS比较/0.bc反证。
7. HOST注入错误210301031指向本表拒收根因；明确排除。

**仍不能闭合，留给手机/native证据：**
- 手机当前registerReceiver的peer身份/设备/tunnel、监听生命周期是否覆盖这些时间；HELLO发送成功只证明phone→watch，不证明phone正在接收READY。
- 手机SDK/系统服务对watch的HEADER+cert派生sender vs module.package究竟如何鉴权/路由；表native sendMsg fail无参数，无法选择“指纹未登记/权限/链路/对端订阅/本地native参数校验”其中任何一个。
- 真实ready JSON、current phone APK、固件/native路由状态尚未独立读取；matching source/public artifact身份不等于双向native授权。
- **状态语义提醒，不定性为新回归/根因**：`S/wearService.js:66,113` isNegotiated只表示REG+open，失败后仍为true；`P:55,165,182` phase可继续ready、watchdog闲置放行、仅detail显示SEND_206。这不证明握手成功，不应把UI“等待手机”或isNegotiated=true作为READY已到手机的验收。

### 双 identity 非对称假设及可证伪条件（父任务补充收敛）
- **精确假设 H（未证明）**：Android 当前 inbound registerReceiver 过滤器以 `watchapp.nexus.0zzip + 表证书派生身份` 为 peer；但 FIT3 service402 的 native outbound 以 `module.package=com.hcbiu.elcton` 生成 local sender identity，而非 HEADER/config app.bundleName。于是 phone→watch 的目标 HEADER 可投递 HELLO，反方向 READY 却不匹配手机过滤器。这能解释方向不对称，**仅与现象相容，不是已发现的表侧回归**。
- 静态前提部分成立：实际 HAP 两字段确实不同，公开旧APK peer身份采用 header+cert（`Q/research/evidence/apk/public-dual-identity-actual.json:4-15`）；父任务另确认诊断APK signer fc08…ad94。**未证实的关键前提**是 service402 原生 sender 来源，以及这些 READY 时刻手机真实 active register 参数。官方 JS `sendMsg` 仅带 destination bundleName/remote/message（SDK `:298-306`），不暴露 local identity 算法；本次没有401+ native源合同，因此不得从 module.package 静态值推断其被用作 sender。
- **直接 falsifier**：同一次 READY 的 native outbound 实际 sender/phone入口 peer，与当前 Android register 期望 identity 完全相同（尤其确为 header+同一cert派生identity），则 H 的身份错配前提被推翻；或同版本原生源合同明确 local sender 取 HEADER/config app.bundleName 而不取 module.package，且运行字节对应，则同样推翻。
- **最小判别取证（仅供父任务后续授权，不在本次执行）**：在同一设备/时间/注册generation中同时读出精确 Android register 过滤身份、native outbound local sender 与 ingress结果；如果确实不同，再以受控手机侧诊断接收器只改变 peer过滤身份、保持表HAP/READY完全不变。更改后能接收原本失败的同路READY才支持 H；仍无消息不能单独证实/否定 H，可能发送在更早native层已经失败。不要先改表bundle/module.package/证书来“试”，否则会破坏多变量可证伪性。
- 父任务最新官方 Android P2pClient 文档观察未见 `connectChannel`；这是父任务提供的上下文，本子未重新抓取，**不把不存在证据的方法当成必需连接步骤或补丁依据**。

## F. 写入与问题
- 仅新增指定两文件。报告/清单记录读取输入SHA256、实际包内条目SHA256、离线测试真实输出摘要；不包含logger endpoint/write/read key、账户凭据或私钥。
- 检查仍为read-only；既有大量untracked QA文件不归本子任务、未清理。原始app sourcemap未含wear源码列表，故不靠sourcemap声明源相等，改用实际module622字节比对及编译字节VM。
- 本次结论是“代码层若干假设被排除，native发送失败根因仍未知”，不是“已修好”。
