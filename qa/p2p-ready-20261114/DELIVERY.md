# P2P 准备回执候选包：交付与真机判读

## 当前状态

**双包已构建、取回并独立复核，供用户真机点测；尚未装机，不能称206已消失。**
只改HELLO/READY通信、必要接线与候选升版。不动身份、证书、Scope、表盘线；旧测试逐字不变，旧包和金样保留。

根因与官方引文：[ROOT-CAUSE.md](ROOT-CAUSE.md)。源码审查：[R1](REVIEW-R1.md)、[R2](REVIEW-R2.md)、[R3](REVIEW-R3.md)，原失败记录不覆盖。

## 1. 实际交付包

手机：
- 包名 `com.hcbiu.elcton`，versionName `0.2.8`，versionCode `10`。
- `/storage/emulated/0/Documents/elcton-WearEngine-真机联调-20261113-123000/phone/hc课程表-0.2.8-code10-2097f32-p2p-signed.apk`
- 字节数 `8183987`。
- SHA-256 `d5778fd80f1bd3758d0c9f2cead660af49aaf6912e2638dc16616bec808bc633`。
- 签名仍为 `fc08a0b474a8ffca5887bd5c88ac15e865a63a64eca81c10f344496c46d9ad94`，本地apksigner验证v2/v3；aapt2二进制manifest验证0.2.8/code10。

手表：
- 包名 `watchapp.nexus.0zzip`，versionName `1.1.15`，versionCode `1000118`。
- `/storage/emulated/0/haps/elcton-20261114-P2P准备回执-1.1.15-73c7823.hap`
- 字节数 `835972`。
- SHA-256 `8865474d76d278f6d61050f4cebca1c1a70b0f5f391f653523d9c9018c91bac0`。
- 精确profile SHA256 `29675fba03bc5be63ba4072c4ab0daec58090c9df3447496b52892c6dd0c764e`，与旧包同证书链/同开发证书。

交付用exclusive-create拒覆盖、复制后逐字比较。34fix金样仍在原路径只读，SHA256保持 `464738a7dee163e22a24309568e4132924b092899ab5341e6627282bb6068bb0`。没有移走/删除旧证据或金样，没有自动安装/卸载/清数据。

## 2. 源码、构建与复验

两仓分支均 `fix/p2p-ready-receipt-20261114`，未推master：
- 表构建源码 `73c7823ca69deb5e176df52dda89fd02940db67c`；CI https://github.com/lantianhcgp/elcton/actions/runs/43568470190
- 手机构建源码 `2097f32ab9ef573e060ef42d076799c9c274e38b`；CI https://github.com/lantianhcgp/elcton-phone/actions/runs/43568230547
- 交付证据以 `[skip ci]` **另加文档提交**；分支HEAD会晚于source-sha，但产品字节与上述构建源码相同，不拿新HEAD冒充重新构建。

结果：表251/251、Android89/89无失败无跳过（含真实BuildConfig版本）、纯Kotlin88/88、Python75/75。真实Kotlin MCP HTTP CI自测1164断言通过。原29个表测试文件/20个手机测试文件均逐字未改。

表HAP本地CMS/profile/签名链/有效期/1B破坏负例/28项资源全集/AST全过，APP与HAP除签名包名配置外字节一致；本地静态报告与CI完整字段相等。原SDK二进制SHA `7cb8af6c01f4848216f429bf35d1d497734ee299e055f3f93d58a4d176cfda31` 在CI解析7份实际JS均成功，本地没有该SDK执行，只交叉验证真实CI记录与载荷SHA。应用5954B、接收页40979B、最大页43685B，均低于49152B。

最终编译app/page经固定上游hmlwsim Sandbox执行5模式：modern401、legacy303、send206、badVersion、pendingRead。原构建字节不改，API是显式契约夹具；**不证明Bluetooth/真机文件系统/堆/像素**。见 `evidence/compiled-ready-host-73c7823.json`。

## 3. 真机点测：先只测握手，不立即覆盖课表

全部安装和点击归用户。不要清数据或卸载旧应用；先按自己的备份方式保留两端课表，再手动覆盖安装这两个同签名候选包。

### A. 版本核对

手机保持前台，通过系统应用信息或MCP `version_info {}`，必须实际显示0.2.8/code10。表安装器/应用版本应为1.1.15；旧设置截图或文件名本身不能证明已装到新版本。

### B. 重现“已点接收，但稍晚连接”

1. 表：周视图 → 同步 → 手机同步页 → “开始接收”。保持同步页在前台、屏幕亮，不退出到首页。
2. 留意表页详情：正常协商应出现 `SDK<实际数字>|VER|PKG|CERT|REG`，随后尝试主动READY；302路径可能无PKG。无版本路径只会是 `UNVERSIONED`，它仍保留30秒期限，不代表本修复的协商成功。
3. **等40–60秒再在手机连接**，用来覆盖旧30秒自动退订缺陷。手机同步页点“查询配对设备”，再点实际已连接手表卡片。无需反复切页或重新点开始接收。
4. 预期：手机从“等待手表准备”转“手表已准备”，`ready=true`、`busy=false`。表详情出现HELLO与READY_OK（环最多保留6项，早期标记滚出正常）。这一步只证明准备回执，不写课表。
5. 如果主动READY在手机尚未注册前出现 `回执失败 SEND_206`，**暂不据此宣判**；保持表页，手机连接后HELLO应重新请求READY。若后续仍206/无READY，截图保存两端当时状态，别只反复点按钮。

### C. 错误判读（同一时刻两端取证）

- `VERSION_UNAVAILABLE/INVALID/UNSUPPORTED`：服务查询缺失、抛错或格式/最低版本不符，不是“没点接收”。
- `BUS_UNAVAILABLE/APP_CHANNEL_UNAVAILABLE`：所需消息总线或应用factory不可用；保留实际SDK阶段。
- `PKG_<码>/CERT_<码>/CONFIG_UNAVAILABLE`：对端运行时身份配置未完成。实际包签名匹配不能替代固件API接受性。
- `REG_<码>/REGISTER_UNAVAILABLE`或一直没有REG：注册阶段失败/未回调；初始化30秒后应可读报错并停止，不永久busy。
- 有REG但无HELLO：手机发出的HELLO还没有到表接收器，后续查出站/前台/蓝牙/总线方向；此时不把Scope重开，也不归咎没点按钮。
- 有HELLO但 `SEND_206`：手机→表已到达；表→手机回执链路失败。手机若收到合法准备ERROR，应直接显示“手表准备失败（码）”，不再提示再点接收。
- 有HELLO与READY_OK但手机仍无ready：表底层报告发出回执，但手机未接纳，需检查手机接收/协议校验方向。READY_OK不是保存成功。
- 表一直正在准备/读盘：30秒应结束为错误，pending读盘不能永久绕过超时；失败后迟到回调不能改回成功。
- 离开表页/onHide后监听停止是保留的前台约束，不能据此要求后台一直接收。

MCP（用户执行，只读）：手机App前台，`127.0.0.1:8766/mcp`；token仍由 `run-as com.hcbiu.elcton cat files/mcp/token` 当场取，不复制进报告。开始前/成功时/失败时各保存：
- `version_info {}`
- `diag_read {}`（status/detail/ready/busy/deviceCount）
- `error_tail {"limit":128}`（完整错误记录）
同时拍表同步页详情和手机状态，带相对时刻。端口/token无响应不自动拉起App，此处由用户保持前台。fs_read只读原工具允许文件，不读课表或token做证据。

### D. 握手通过后再测真实保存（可单独进行）

手机点“同步到选中手表”。若弹覆盖确认，先核对备份与方向再决定。预期收到APPLIED后手机“同步成功”、表“同步完成 / 已保存并回读确认”。返回周视图核对课程；重新连接时revision/digest应一致。只有传输207或READY_OK不能算保存成功。

按“断开并停止同步”并退出表接收页，重新按B开始；检查无旧busy/迟到READY复活。若提交已进入不确定窗口，按原提示重连核对最终课表，**不要把取消/超时当作回滚证据**。

## 4. 待用户回填

- [ ] 实际装机版本正确。
- [ ] 表先接收40–60秒后手机仍收到READY。
- [ ] 同时段SDK/REG/HELLO/READY_OK与MCP状态已保存。
- [ ] 真实同步收到APPLIED并回读一致。
- [ ] 断开/退出/重进没有残留busy或迟到成功。

以上尚未执行。FIT3当前固件、服务版本、真实蓝牙/HMS路由、低堆、其他手表兼容和像素均未由本棒证明。查到动态签名/总线的确切固件失败再修，不盲换证书、不清Scope缓存、不碰表盘。
