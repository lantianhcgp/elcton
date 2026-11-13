# HMS 根因排查证据

最终结论：非华为手机安装 HMS Core 是 Wear Engine 官方要求，本机缺项已证；本次 WearEngineException 的数值错误码／失败阶段未保留，根因仍未定。安装与验证只写方案，不执行。

入口：

- [HMS根因排查.md](HMS根因排查.md)：主报告与下一步、不执行的官方安装方案及副作用。
- [sdk/调用链与错误码.md](sdk/调用链与错误码.md)、[方法摘录.json](sdk/方法摘录.json)：官方AAR与已装App的接口核对、Health服务端分支。
- [runtime/现场只读核查.json](runtime/现场只读核查.json)：只读现场脱敏摘要、样本哈希和签名。未公开个人全量日志／完整安装列表。
- [official/官方口径核查.md](official/官方口径核查.md)、[来源索引.md](official/来源索引.md)：官方完整正文与边界。
- [community/community-evidence-zh.md](community/community-evidence-zh.md)、[coverage.json](community/coverage.json)：正文／评论与获取限制。
- verification.json / delivery-manifest.json：发布前检查和逐文件哈希清单。远端逐文件读回结果另见本地进度文件；清单不会自引用自己的哈希。

工作范围：独立克隆、独立分支 qa/hms-root-cause-20261114；基于 fix/wearengine-install34-20261113 的 0be04ed667392401c6024d892feb6983928c903c。不修改master、应用源码或留白S67；不新增后台浏览器／设备操作。

隐私／完整性：仅提交任务相关解释、有限方法摘录、公开网页和脱敏现场摘要；无APK/dex、私钥、用户账号/设备UUID或个人原始日志。官网响应header中的匿名WAF cookie已去值；脱敏前元数据保留在克隆 .git/hms-analysis/prepublish-originals/。正文没有本地截断；元数据脱敏不改正文的SHA-256。失败抓取记录保留并标记不可引用，Reddit不声称实时完整评论总数。

复核：在此目录运行 python verify_evidence.py；官方正文另外可运行 python official/assemble_evidence.py（后者更新本地核验时间文件，不用于验证commit哈希本身）。不运行网络采集脚本也可验证现有证据。仓库本来公开，没有变更可见性或访问配置。
