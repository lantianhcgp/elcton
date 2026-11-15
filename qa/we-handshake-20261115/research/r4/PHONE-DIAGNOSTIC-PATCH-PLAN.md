# R4 手机侧诊断补丁方案（仅方案，未授权实施）

**目标：** 保持手表1.1.16和手机0.2.9现有行为不变，一次配合实测把“手机接收器未生效 / 原生路由身份不匹配 / 收到了但被协议拒绝 / 原生服务在入口前失败”分开。

**状态：** R4仅只读取证并交付本方案。未改手机代码、未push手机仓、未装机、未操作手机/手表。表端常亮/logger/签名链均冻结。真机反向发送根因仍未唯一；这不是“根因在手机代码已证实”，也不是“握手已修复”。

**参考基线：** 手机`~/elcton-phone-release-029-20261114` HEAD `bb26c64b67e1cfa7903cd709c2aac482f6490e6b`；构建源/实际APK以`research/evidence/apk/index-and-identity.json`为准。表端构建源`cbd171553e70eb614ca4283534915b92ebb870de`，1.1.16/code1000119，已交付HAP SHA256 `1d013924b2f2123b67f63926cc641bbf7e4fd9468db53e2ab2a4b04792d87f9a`。这些是本地源码/交付产物身份，不等于本轮重新拉取了运行设备字节。

## 1. 为什么先补日志，而不是添加 connectChannel

- 当前实际Android SDK `5.0.3.301`的P2pClient与官方Android参考均没有`connectChannel`方法。使用的是设置peer → `registerReceiver(device, receiver)` → 注册Task成功后发HELLO；不能套用HarmonyOS手机API同名概念或虚构一个连接步骤。
- `SyncEngine.kt:162-213`负责安装检查→注册Task成功→HELLO；`WearProbe.kt:150-182,199-208`是实际register/send适配器。`WearProbe.kt:42-66,78-84`以`SyncEngine(this, ...)`共享这一适配器，`PhoneActions.connect`也只转到同一个SyncEngine，不另造通道。nativeGeneration与engine generation是两层防旧回调守卫，不是两条独立连接。
- `registerReceiver`成功只能表示手机SDK注册Task成功，HELLO发送成功只能证明手机→表方向；二者都不是READY已经返达手机的证明。
- 表端已经实见HELLO4次，实际1.1.16路径是同一channel，REG后才发READY。没有可定位的表侧JS缺陷可据以做RED→GREEN修补。
- 当前没有`emitWearError`。注册同步异常与当前代次注册Task失败（`WearProbe.kt:172-182`）、发送Task/同步异常（`:199-208`）、注销Task/同步异常（`:194-196`）已调用`describe`；它捕获`WearErrorRecord`并调用`diagnostics.record`（`:211-225`），后者更新lastError并尝试追加错误journal（`DiagnosticRuntime.kt:86-99`）。必须保留这条异常通路及原回调守卫；过时代次注册Task失败并不保证进入describe。
- 缺口是成功阶段及其时序、原生整数`onSendResult`（`WearProbe.kt:205`；`SyncEngine.kt:349-354`仅据它推进/失败状态）、Receiver入口和被generation/type/byte/协议过滤丢弃的包。`error_tail`不是完整P2P阶段流水，`diag_read`是状态快照；零新增既不能证明SDK没失败，也不能证明注册器有效（还需核对journal写入失败、代次及采集窗口）。

## 2. 方案比较与选择

A. **推荐：纯观测、零行为改变。** 为同一WearProbe transport的adapter层与SyncEngine业务层记录注册、发送Task、SendCallback、原生收包入口、协议判定及注销；这是共享适配器上的两个观测层，不是两条独立通道。把Task/原生SendResult/业务READY分层。最小改动、不会把未知根因写死；代价是需用户另授权手机诊断包并组织一次真机实测。

B. 直接改手机peer过滤身份、重注册策略或表端module.package。当前缺少native sender身份与活动过滤器证据，容易多变量试错和破坏安装/通信身份；**不采用**。

C. 只增加表端重试/延时。表已在REG约101秒后收到后续HELLO并重复失败，短延时并没有对应证据，重试会继续生成相同206；**不采用**。

## 3. 冻结的契约与允许文件

实施必须是另轮、用户明确批准后。在新独立目录/分支基于核实后的手机HEAD工作，本R4目录不能转为手机开发场。

允许修改（批准后）：
- `app/src/main/java/com/hcbiu/elcton/WearProbe.kt`：现有P2P回调周围的观测。
- `app/src/main/java/com/hcbiu/elcton/SyncEngine.kt`：连接/发送/接收/超时状态的观测。
- `app/src/main/java/com/hcbiu/elcton/DiagnosticRuntime.kt`：有界事件队列与诊断快照；其磁盘写入沿用单线程、非SDK线程、失败不能阻塞业务。
- 新建`P2pTrace.kt`、`P2pTraceTest.kt`及针对现有边界的观测测试；测试所在目录沿现有`app/src/test/java/com/hcbiu/elcton/`。
- `DiagnosticTools.kt`/`PhoneMcpTools.kt`仅在确有必要时增加明确只读的`p2p_trace_tail`工具；原`diag_read/error_tail/version_info/fs_read`响应字段、写工具权限/确认逻辑保持不变，不把旧error_tail改成成功事件流。

冻结：Wire协议、ready判定、generation/attempt guard、重试次数/超时、注册/注销调用顺序、peer包名/指纹、选中设备、MainThread所有权、0.2.9 UI/主题、MCP保活、常驻服务数量、权限、签名。事件记录必须自身try/catch隔离；磁盘失败、队列满、数据字段抛异常时业务返回/回调次数和顺序与未打点代码一致。

## 4. 事件合同

公共字段：`schema=1`、`origin=phone-device|host-test`、`sid`、单调`seq`、`wallMs`、`elapsedMs`、`layer=adapter|engine`、原有`nativeGeneration`/业务`generation`的相关引用、`attemptId`、`stage`、`outcome`、`stale`、`bytes`、`dropped`。不能把两种generation数字强行当成相等；通过现有注册/发送闭包关联，不新建业务状态。

- 不落课表全文、姓名、设备MAC/序列号、token、URL查询密钥或账号；设备用当前扫描列表序号/单会话匿名引用。公开包名及证书派生指纹允许出现在本机诊断身份快照，但不得带私钥。原生/异常message若可能含消息正文或凭据须脱敏；完整敏感原件如确需保留仅放私有诊断存储，不进入GitHub。
- 连接generation和发送attempt沿用已有变量/`SendAttempts`结果，不新增状态推进者。观测不能调用SDK、不能抢夺设备、不创建第二个Receiver，不用新定时器改变发送顺序。
- P2P文本原始入口最多记录长度、ASCII判定、字段形状/类型、type/protocol/version/sender和transferId的匿名相关引用；不得记录课程正文。拒绝原因由与现有`PacketIngress.watch`等价的旁路只读分类器报告，业务仍以原校验结果为准。
- 建议默认队列128条；单事件文本上限2048字节，记录截断标记及原长度；队列满时增加dropped，不能静默伪装全量。磁盘按现有用户保留规则只压缩、不自动删除。没有用户批准的配额清理；配额满则停止新增并显示`trace_storage_full`，不影响传输。

必须事件及精确位置：

| 事件 | 位置与内容 | 不可误读 |
|---|---|---|
| CONNECT_REQUEST / PEER_CONFIG | SyncEngine.connect（`:162-203`）与WearProbe.identify/register（`:86-89,150-182`）；观测layer、代次相关引用、设备引用、配置peer身份 | 仅请求/参数，不是原生连接成功；不新增通道 |
| REG_CALL / REG_TASK_OK / REG_TASK_FAIL | 原registerReceiver调用前及原Task成功/失败回调；Receiver代次和期望peer身份 | Task成功不等于READY收到 |
| SEND_CALL | 每次现有send前；HELLO或业务包类型、bytes、attempt | 未调用成功，不伪造SendResult |
| SEND_TASK_OK / SEND_TASK_FAIL | P2pClient.send返回Task的已有/新增纯观测Listener | Task层与SendCallback层分开，不把Task<Void>完成当207 |
| SEND_RESULT | 原SendCallback.onSendResult；原resultCode及attempt，过时代次也记录stale但不推进状态 | 官方206/207的语义与Task异常不同 |
| RX_NATIVE_ENTRY / RX_ADAPTER_REJECT | 仅WearProbe Receiver入口（`:155`），在原generation/type/bytes过滤（`:156-161`）之前记录入口；随后只读记录原过滤拒绝原因 | SyncEngine的transport回调（`:188`）已收到过滤后的ASCII文本，不是第二个native Receiver |
| RX_DECODE / RX_ENGINE_ENTRY / RX_PROTOCOL_ACCEPT / RX_PROTOCOL_REJECT | WearProbe原bytes解码（`:160`）与SyncEngine.onMessage/PacketIngress（`:215-218`）各原结果之后；payload元数据、拒绝分类，不改变原返回值 | 引擎入口已经过adapter过滤；拒绝不能静默消失，也不是原生路由失败 |
| READY_ACCEPT | 仅原来接收到合法READY、当前generation且原状态逻辑接受之处 | 唯一允许ready=true的现有依据不变 |
| INSTALL_TIMEOUT / REG_TIMEOUT / HELLO_RETRY / READY_TIMEOUT / CLOSE / UNREG_CALL / UNREG_TASK_OK / UNREG_TASK_FAIL | 安装检查、注册各自原15秒timer（SyncEngine`:175,186`）；HELLO原每次5秒timer及3次retry（`:206-212`）；原fail/cancel/close与WearProbe注销回调 | 首HELLO为t=0；无READY或更早失败/取消时发送约0/5/10/15秒、20秒耗尽。只观察原终止事件，不引入15秒READY截止；记录cleanup触发原因及作废前代次引用，不能把后果当原因 |

`diag_read`可以增加向后兼容的`p2p.lastStage/registrationGeneration/traceSeq/dropped`字段；`error_tail`继续只装错误。新增只读tail工具返回`events`和`has_more`时必须由实际有界记录算出，不宣称未知总量。

## 5. TDD与零行为改变门禁（未来实施，当前未执行）

每任务2—5分钟；先在独立手机分支保存RED输出，禁止改旧断言凑绿。

1. **事件写入器：** 先测无实现/异常写入、满队列、脱敏、seq、schema及明确host-test来源；再最小实现；以全回归证明不改原诊断工具。日志失败不准向业务抛异常。
2. **注册/注销观测：** 假SDK调用序列作为未打点oracle；同步/延迟成功失败、旧generation、取消后晚回调；RED时应仅缺事件，原oracle不修改。GREEN必须调用参数、次数、顺序、关闭守卫逐项相同。
3. **发送两层回执：** Task成功后原生206、Task失败但无SendResult、原生207、迟到/重复SendResult；记录原值，不合并Task与SendResult，不重复完成回调；attempt guard保持原样。
4. **收包入口与协议拒绝：** 合法READY、非法sender/version、过大/非ASCII、解码异常、取消后的迟到包；证明RX_NATIVE_ENTRY总在原校验前且拒绝包不推进状态。
5. **原超时观测：** 分别覆盖安装检查与注册原15秒timeout，以及注册成功后的HELLO原5秒/次、初发+3次retry。受控clock证明无READY/提前失败/取消时约0/5/10/15秒发送、20秒触发原READY耗尽及正常fail→unregister清理（`SyncEngine.kt:99-103,175,186,206-212`）。只新增观测；不新增deadline、重连或额外重发，不改原clock/timeout/次数。也覆盖更早的SendResult失败/取消，不能要求它们等待20秒。
6. **完整门禁：** 两阶段SPEC→QUALITY，旧Node/JVM/真实HTTP/MCP/UI测试不减项；按当前workflow完整构建新APK并验精确源SHA、版本升级、同签名fc08…ad94、APK中实际新事件/接口和旧行为未漂移。装机及真机复测必须由发起方组织，Agent不能自行启动设备操作。

现有CI实际命令（不是本R4运行结果）：
`gradle -PelctonP2pCandidate=true testDebugUnitTest assembleDebug assembleDebugAndroidTest --no-daemon --stacktrace`

MCP真实HTTP自测沿现有workflow的`:app:writeDiagnosticHostClasspath`及`qa/mcp_http_selftest.py --classpath <实际classpath>`，不要猜占位classpath作为执行记录。其余0.2.9全量验收以冻结原release gates为准，不裁剪成仅单元测试。受控fake SDK全部明确host-test；禁止将宿主事件混到phone-device或watch-device证据。

## 6. 发起方组织一次实测及判别表

在获准的新诊断APK安装后，由发起方确认版本与签名、原HAP不变。Agent只交付程序/报告，不操作设备。

1. 发起方在表上进入现有同步接收页；确认KEEP_ON/logger仍工作。
2. 发起方在手机完成一次正常扫描/连接，观察现有HELLO/READY至合法READY或原失败/取消终止事件；无更早终止时从首HELLO起约20秒耗尽，发送约0/5/10/15秒（不含此前安装检查/注册各15秒窗口）。不得在15秒人为截断采集；不自动来回拉起App，不覆盖/删除课表。
3. 收集同一窗口手机事件、`diag_read`/`error_tail`与表logger；按SID来源、generation、顺序、时间范围比对。先读本机buffer/dropped/云分页，seq缺口必须报告，不补造。

| 观察 | 支持的下一分支 | 不能断言 |
|---|---|---|
| 同一连接/Receiver关联代次有非过期、非预期REG_TASK_FAIL或过早UNREG/CLOSE，且因果顺序证明发生在相关READY尝试之前并使该尝试失效 | 仅在证明责任边界后提出另授权的单变量手机订阅/生命周期修复及TDD；否则根因仍unknown、继续取证 | 必须排除用户取消、原READY耗尽/发送失败引发的正常fail→unregister、close→cancel清理及旧Receiver释放；HELLO后出现UNREG/CLOSE本身不证明原因 |
| REG_TASK_OK且有效代次持续，表SEND_FAIL，手机无RX_NATIVE_ENTRY | 原生入口前路由/服务/身份仍未知，带版本/参数/公开证书证据向原生服务深入或提华为工单 | 不能单靠零入口就定手机bug/指纹错误 |
| RX_NATIVE_ENTRY出现、RX_PROTOCOL_REJECT | 路由已到手机，按真实拒绝字段修协议/解码责任端 | 不能把native206和未见的同一包强行一一配对 |
| RX_PROTOCOL_ACCEPT但无READY_ACCEPT，代次/stale异常 | 手机状态/代次责任端有可复现证据 | 不能放松原guard“修绿” |
| READY_ACCEPT + 同窗表SEND_OK | 仅HELLO→READY双向握手闭合；课表发布/回读仍单独验收 | 不能冒称完整课表同步成功 |

上述各行只是证据分支，不是实施许可。`SyncEngine.kt:99-103,208-210,325-335`明确fail/cancel/close会清理，`WearProbe.kt:186-196`作废native代次并释放旧Receiver。需记录作废前关联代次、触发原因和相关attempt，区分因果与时间相邻；没有因果证明不得归责，任何修复仍须用户另授权。

## 7. 双identity疑点的受控边界

本地HAP的HEADER/config app/profile bundle为`watchapp.nexus.0zzip`，module.package为`com.hcbiu.elcton`。这是真实静态差异，不证明service402的native local sender取哪一字段。Android peer当前是header+65B EC公钥派生身份；改表module.package、换证、改手机fingerprint都不在首轮纯观测方案内。

只有取得原生outbound sender/活动手机过滤器/手机入口peer的实际身份并证明不一致，才提出另授权单变量过滤器对照。若实际native sender等于header+同证书，则此身份错配假设被证伪。若服务根本未发到入口，改过滤器仍失败不能证明或否定该假设。

## 8. R4交付边界

本方案没有改变任何软件，也没有提供“修复包”。下一步所需决策是是否授权**手机侧纯观测诊断迭代**；不是批准根因猜测。原1.1.16包保留，不重新签旧字节来伪装新版本，不移动/删除/替换`/haps/`中的任何包。
