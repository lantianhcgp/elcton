# P2P 准备回执专项（2026-11-14）

用户事实：FIT3 已打开手机同步页并点“开始接收”；手机设备发现 deviceCount=1，两轮没有 READY，发送失败206。不得改口成用户没有点接收，不得重查已结案 Scope。

红线：只改 HELLO/READY 通信和必要接线；签名身份/证书不动；既有测试及金样字节不动；证据不删；不自动装机或抢手机前台；不触碰表盘线。

基线：表端 0be04ed667392401c6024d892feb6983928c903c（34fix基础）；手机 cd2a3e062b97d778c79b76b544071b1077534af7。

已确认事实及分级：
- 实物HAP公钥65B EC点推导的Lite SDK指纹与手机常量一致；实物APK证书SHA256与wearIdentity常量一致。不是换证书题。
- phone-sync.js:38-48 开始监听30秒即stop，stop:156-164会退订；可复现“先点接收、稍晚连接”导致不再有接收器。现有日志没有表按钮时间戳，不能声称它独自解释两轮真机。
- wearChannel.js:16-29 直接走native，不创建官方P2pClient初始化所需的 getWearEngineVersion({sdkVersion:'3'})，也没有401阈值的FeatureAbility分流。对错误总线可用契约模型复现，但不能拿模型证明native底层必须该参数、或FIT3具体版本。
- phone-sync.js:151-153 主动READY send无回调；HELLO应答路径:126只有笼统提示；错误证据被丢失。
- 手机 WearProbe.kt 的onMessage在awaitingReady时只处理READY，忽略有效ERROR；这会把表端明确报错改成通用“没点接收”提示。实际父代理重测：PacketIngress允许原生file读错误数字代码300/301/302（子审计此项错误，不能据其更改产品解析器）。

修复验收：
1. 先查询可用native服务版本，sdkVersion='3'；在查询完成且注册成功前不发READY。>=401走@system.wearengine，302/303走官方FeatureAbility（不支持则明确失败）；不得把未知或坏查询结果猜成现代服务。
2. 没有版本查询API但既有原生方法可用的旧能力路径保持原有保守30秒超时，并明确为unversioned兼容路径；不能据此宣称已完成SDK协商。实际查询成功+注册成功的空闲等待可以续保监听，事务/初始化仍30秒受限，hide/destroy/cancel立即退订。
3. READY发送失败保留短状态+有界阶段/码值（不打印课表内容或密钥）。回执成功不等于课表APPLIED。
4. 手机错误仅在等待回执时明确处理，并保留既有事务ACK/APPLIED安全校验、失败cleanup、MCP四只读工具和完整错误日志。
5. 原有测试不改；新负例证明协商/旧总线/晚回调/空闲30秒/READY失败；原有超时/数字0句柄/提交不确定性回归同样通过。
6. CI构建签名后实际包与源码versionCode/name相同；HAP包名watchapp.nexus.0zzip且profile不变；APK com.hcbiu.elcton且证书不变；compiled JS每页<49152B及无外部require/非法语法。
7. 工程/报告入独立修复分支，GitHub独立读回。交付候选包，不宣称真机通；真机由用户安装点测并记录服务版本/注册/HELLO/READY/APPLIED。
