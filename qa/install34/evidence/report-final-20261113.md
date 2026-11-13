# WE 表端安装 34 排障报告（候选已交付；真机待测）

目标：FIT3；失败包 elcton-20261113-wearengine-timerfix.hap，SHA256 e61ea7189ce342bdefc905d15c131d6c5ce8cbf0b8169f26a5dfb98441ca4b1d。沿用发起方已核验的手机/交付源/检查单三方一致结果。

## 已完成三步调查

1. 锁定失败包：版本 1.1.13 / code1000116，无装错包证据。
2. 实际拆包：timerfix 和 probe 均 0xBE、28 文件、相同文件顺序、相同 p7b SHA256 29675fba03bc5be63ba4072c4ab0daec58090c9df3447496b52892c6dd0c764e、相同 CMS 三张证书；API/deviceConfig/页面清单一致。仅版本字段、phone-sync.js（48654→48760 B）及其 map 不同，其余23文件逐字节相等。
3. 两份完整 CI 日志已解析；timerfix 日志1889行、probe日志1812行，均无 Failed to convert。timerfix：1715行 debug 构建、1763–1764行旧键盘CSS align-content警告、1767行 Lite JS 编译完成、1799行 BUILD SUCCESSFUL、1804行格式压缩、1825行 CMS/profile/整包摘要通过。没有 snapshot 失败硬证据，不能拿无 .bc 定罪。

## 证据边界

- probe 不是已证实可安装正对照：00第3行/02a第8行明确尚未装机。原“基线”只表示同源构建，不能将它当安装成功。
- 已找到历史成功正对照：elcton-1010-切片同步v3-防卡死.hap。历史交付后用户直接回填“这次可以了”（会话20261009_065343_837613c2，消息52924/52925）；现存归档文件MD5与历史交付一致：653f9dafa23909e43b37cfb8f16ff7e6，SHA256为16376f777f46333d7920cc20a27f9bd2301321de5503b1aee89bcbf44efe1df0。已完成AST复核：历史包所有6份JS正则均为0，并非仅文本搜索。
- 失败包实际AST有正则 .test() 调用，旧成功包的文本初筛未见；这是本轮优先候选，非本轮真机因果定案。logsink历史34经验仅作线索，不推广成所有正则禁用。
- 手机APK是否已装、表当前版本/身份在交付记录中没有确认；本轮不自动安装、不抢前台、不清数据。仍列待用户确认。

## 隔离和后续

工作区 /data/data/com.termux/files/home/elcton-wear-install34-20261113；分支 fix/wearengine-install34-20261113，基于9517f345e8d0e0995708b0a5d0b37b4cae8689ac。原两个工作区和master保持原样，留白S67未读写。证据暂在该工作区qa/install34/evidence，审计后推本分支；不在Documents堆积新原始日志。

接下来：完成受控候选的CI出包/签后全载荷核验 → 新包只增不覆盖，安装仍由用户执行。SDK诊断阶段已完成，不再重复旧取证。

诊断CI已完成成功：https://github.com/lantianhcgp/elcton/actions/runs/43406921543 ，精确源码09364b3e928a92cdd01789f8086a23c1c3b49ec3。结果在仓库qa/install34/evidence/sdk-initial/native-sdk-control.json：同版CLT的jerry SHA256 7cb8af6c01f4848216f429bf35d1d497734ee299e055f3f93d58a4d176cfda31；普通ES5和字符循环通过，正则字面量（包括死分支、test/exec/replace）均SyntaxError；历史成功包6份JS全过，失败包app.js过、6个页面均SyntaxError。这个结果证明SDK解析兼容问题，不证明FIT3安装因果已闭环。

当前候选源码已改：仅已定位正则表达式的等价字符检查/替换；版本提升至1.1.14 / code1000117；原定时器修复、功能、页面设计、压缩策略、49152B门禁、p7b及签名器均保留。203项本地测试已通过；UTF-16转义、ID/摘要/日期时间/取件码接受集合有原实现对照。新增代码做了短局部变量处理以保留体积门禁（最大页面源级预估49129B，仅估算）；实际CI出包与签后SDK门禁仍待执行。独立审查进行中。

原197项测试在本机全部通过；旧命令的实验性Node参数已被本机新版Node移除，去掉该参数用自动模块识别通过，未改产品package类型。CMS三张证书直接签发关系/时间均通过；实际失败HAP偏移64异或1负向样本被完整摘要门禁拒绝。

本文件最终收尾将补全确切CI、新包SHA及残留进程核验；当前不声明已修复或已可装。

## 402 接力进度

- 续棒模型 gpt-6.1-sol；未试 astra。19:25 版报告已原样备份到隔离分支 qa/install34/evidence/report-checkpoint-1925.md，既有原始证据不改。
- 本棒以原固定 QA 依赖 elcton-sim-qa（2b28919fc14ea25eaed46f895817d58e481a8657 + 已披露补丁）重新执行全套：240 测、240 通过、0 失败、0 跳过。首次误指向未打补丁的 hmlwsim 时 4 项仿真器测试失败；修正依赖路径后通过，未改产品源码。新 TAP：qa/install34/evidence/resumed-local-tests.tap。
- 候选已提交并回读远端：e62fe509e111a1762f87761694f0c28f506448a7，仍在 fix/wearengine-install34-20261113；master 仅只读核对，起始 SHA 851537a9fade0e941f7a20f4078a04c90f2d2343。
- push 首次 TLS EOF，改 HTTP/1.1 推送成功；精确源码 CI 已启动后台有界跟踪。签后门禁尚未完成。
- checker 原 36 测与 passed:false 原始回执保留；缺失的独立 gate-rereview 正在规范/需求双轴复核，不把状态哈希旁证失败改成通过。
- 本棒未启动浏览器/临时服务、未安装或启动手机/手表 App，未读写留白 S67。

续棒状态：完成；CI、签后全载荷、独立双轴、旧包归档和新包交付均完成，真机安装由用户执行。

- 首轮候选 CI：https://github.com/lantianhcgp/elcton/actions/runs/43419821130，源码 e62fe509e111a1762f87761694f0c28f506448a7。240 项 CI 回归通过、SDK 构建通过；但 format-only 后实际 phone-sync.js 为 49305 B，被原 <49152 B 门禁拒绝，未签名、未交付。
- 完整失败日志已新增保留在 qa/install34/evidence/ci-failure-e62fe50.log（2085 行，拦截证据 2048–2054 行）。源级估算 49129 B 与实际不同，不再用估算替代门禁。
- 正在只对新增兼容帮助函数/直接修改的局部变量作行为等价紧凑化，功能、页面、原定时器修复与签名身份不动，压缩策略和体积门禁不放宽。独立 checker 双轴复核并行。

续棒实际进展时间：2026-11-13T20:39:11+08:00

- 等价缩减已完成并复核：只改 wearProtocol.js 新增兼容路径，源码 format-only 实测 4555→4312 B（减243 B）；7项原行为对照、240项全套回归均通过。页面实际体积仍须新CI实测，不引用49062 B估算作为通过结论。
- 新的代码增量及取包/回读脚本已冻结，独立规范/需求双轴正在复核（旧checker审查和首轮CI失败原件均保留）。此前审查的需求轴明确因实际49305B与缺签后证据拒绝制品，未强改为绿。
- 收尾取包脚本已实际鉴权回读首轮CI并验证错源码SHA会在写制品前拒绝；最终门禁仍需真实候选HAP。
- 等价缩减及取包/回读代码的独立规范、需求轴均通过实现审查，冻结diff SHA256为02e6c6c5ad2fd7283657f548061b6628a8ca7bb51b8ec9c05fd89588f16a08d5；实际制品尚未批准。
- 新源码提交09b34279a797c93db508d04226a6ebd8a30417bb已推送并精确回读远端；新CI https://github.com/lantianhcgp/elcton/actions/runs/43423716561 进行中。master回读仍为851537a9fade0e941f7a20f4078a04c90f2d2343。后台有界跟踪已开启，完成有回执。
- 新CI已成功完成，240/240、实际构建、原身份签名与签后SDK门禁全绿。下载制品原始摘要与GitHub artifact digest一致。实际新HAP SHA256：464738a7dee163e22a24309568e4132924b092899ab5341e6627282bb6068bb0。
- 本地已对真实APP/HAP重新验CMS/profile/完整华为三证书链/摘要、单字节篡改拒绝与AST；28文件及原顺序保留，页面集合未缩减，非代码资源未改；全部7份JS逐路径/哈希绑定原SDK解析exit0。实际最大页面49062 B，原严格49152 B门禁通过。独立最终制品复核与归档交付收尾中。
- 取包首次因隔离目录为git worktree（.git是文件）报NotADirectoryError，未写制品回执；保留失败并新增仅换cache路径的适配器，原已提交collector不改，重取与验签成功。

## 最终收尾（2026-11-13 20:39）

- 候选已交付：/storage/emulated/0/haps/elcton-20261113-34fix-464738a7.hap；845153 B；SHA256 464738a7dee163e22a24309568e4132924b092899ab5341e6627282bb6068bb0；版本1.1.14/code1000117。
- 精确构建源码09b34279a797c93db508d04226a6ebd8a30417bb；绿CI https://github.com/lantianhcgp/elcton/actions/runs/43423716561，job131879739593，artifact14035925364。APP SHA256 fd5867401fd7cad9f36fe766600015f64d403841c503ca1de41d1dc933d72713；下载ZIP摘要与GitHub记录逐字节一致。
- 原p7b/身份watchapp.nexus.0zzip不变；28文件及原顺序、6页面+app.js、两份页表全部保留；CMS/profile/华为三证书链/完整摘要/偏移64单字节拒绝通过。实际最大JS49062 B<49152 B，余90 B；7份签后JS哈希逐一对应原SDK7cb8af6c…的parse-only exit0，非本地冒称SDK重跑。
- 独立规范轴40份文件、需求轴47份文件复核均passed=true、三类阻塞为空；冻结输入SHA256 bc13d9f74619d04fda39cd9b29984db5a74e9815deee2d6a2ca546c3fe8a2216。汇总产物qa/install34/evidence/gate-rereview.json已落并验证绑定新HAP。旧passed=false回执及第一次超体积日志未改。
- 汇总器首次遇规范轴path→SHA映射与需求轴row数组的schema差异，报TypeError后整条&&链停，未归档或交付。保留原程序/失败回执；仅解析这两种实际结构后逐条SHA/bytes核验，未修改模型判定或放宽门禁。
- 旧WE包仅mv --no-clobber至/storage/emulated/0/haps/旧包归档/elcton-20261113-wearengine-timerfix.hap；838329 B、SHA e61ea7189ce342bdefc905d15c131d6c5ce8cbf0b8169f26a5dfb98441ca4b1d全部保留；新包独占复制，不覆盖。
- 2026-11-13T20:37:52+08:00真实ps进程核验：本任务/Chromium/jerry残留0；原21份历史证据逐字节不变。master只读收尾核仍851537a9fade0e941f7a20f4078a04c90f2d2343。未读写留白S67、未装机/拉起App/抢前台/清数据/换身份。
- 本任务15分钟纯脚本进度job已移除并列表回读确认，其他任务未动。完整代码/测试/失败/签后/独立审查/归档/进程证据将以独立证据提交推本隔离分支，真实构建身份仍固定09b34279；本报告后续只追加远端回读句。
- 结论：已消除本SDK解析层问题并通过完整候选门禁；仍不能宣称FIT3安装34已解决。安装、UI、真实heap和WE端到端由用户回填，此棒不自动操作设备。

巡检记录：2026-11-13T19:58:52+08:00；距上次实际进展 1 分钟。当前仍进行中，不据文件存在推断 CI/签名/装机成功。

巡检记录：2026-11-13T20:00:37+08:00；距上次实际进展 3 分钟。当前仍进行中，不据文件存在推断 CI/签名/装机成功。

巡检记录：2026-11-13T20:15:38+08:00；距上次实际进展 3 分钟。当前仍进行中，不据文件存在推断 CI/签名/装机成功。

巡检记录：2026-11-13T20:30:39+08:00；距上次实际进展 6 分钟。当前仍进行中，不据文件存在推断 CI/签名/装机成功。
