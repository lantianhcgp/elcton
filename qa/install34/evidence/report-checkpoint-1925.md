# WE 表端安装 34 排障报告（进行中）

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
