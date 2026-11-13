# WearEngineException：HMS 缺失根因排查

核查日期：2026-11-13 夜间至 2026-11-14，CST。仅研究与只读取证；没有安装／卸载、点屏、启动目标 App、改设置、清数据、动配对，未修改应用或留白 S67。

## 一句话结论

**非华为手机安装 HMS Core 是 Wear Engine 官方明确要求；本机确实缺失。但“它就是本次 WearEngineException 的根因”仍未定。**

打比方：已经确认现场缺一项官方要求的配套设施，但现有记录没保存“具体在哪一关被拒”，不能把缺项直接当作唯一死因。推荐下一步是先取得原始错误码与失败阶段，再在用户批准后做只补 HMS 的单变量对照；不是今晚自动装东西。

## 1. 判定及证据强度

### 已证

1. 官方 Wear Engine 中／英文入门均要求：非华为 Android 手机除运动健康外，需 HMS Core（APK），并允许运动健康后台弹界面。专属FAQ“为何用户授权界面未显示”也重复该要求。
2. 只读设备为 `Mi 10 Pro`（用户所称 Mi10），Android 13/API33；`com.huawei.health` 16.1.2.310；elcton `com.hcbiu.elcton` 0.2.5/code7。`pm list packages` 中 `hwid|hms|hicloud` 无匹配，`pm path com.huawei.hwid` 无路径：没有已安装的独立 HMS Core 包。这里不把“无独立APK”等同于Health中不存在任何HMS库。
3. 实际 SDK 是工程依赖及官方AAR manifest的 `5.0.3.301`，不是5.0.3.304；已装APK入口另作定向字节核对。
4. SDK 授权检查直接经运动健康 `WearEngineExtendService`（回退 `WearEngineService`）→ `getBinder(5)` → AuthManager。不是直接绑定 `com.huawei.hwid`，也不是凭 `com.huawei.hms.tasks` 的类名判断有HMS进程调用。
5. 只读 dumpsys 显示该 Health 服务存在，最近调用方为 elcton，bind record 为 `requested=true received=true hasBound=false`；Health自身另一路为 `hasBound=true`。说明至少收到过第一段 Service binder；**不声称elcton目前持续连接，更不证明AuthManager／Scope／用户授权已通过。**
6. 当前运动健康是 LSPatch 外壳、含原包和 `cn.wwl.xposed.hook` 模块，不是仅凭版本号可判定的纯官方未修改包。本地保留样本与手机安装文件SHA-256完全一致。
7. elcton 的诊断只保存异常类名；一条套话把7/8/9/13/15/18等多个SDK错误归在一起。本次未取得原始错误码和失败阶段。

### 未定／不能推出

- 未闭合“缺HMS → 本次具体失败点”的因果链，不能承诺安装后恢复。
- 没有HMS专属最低版本的明确数值证据；不套用Health Kit的最低版本，也不捏造“必须6.x”。
- 不能因改包存在就判定它造成错误，也不能当它等价于完整正常官方包。
- 不能由“表已配对、Health能正常用”推出第三方Wear Engine账号／Scope／授权路径也正常。
- “从未弹窗”不是HMS专属症状：checkPermission不负责弹窗；DEVICE_MANAGER可能默认预授权。错误也可能发生在后续设备列表查询，而现有代码没分阶段记录。

## 2. 官方要求：小米不是禁用设备

关键来源均取得正文，不只标题：

- [Wear Engine Getting Started](https://developer.huawei.com/consumer/en/doc/connectivity-guides/dev-process-0000001051058039)：`For non-Huawei phones, HMS Core (APK) is also required`。
- [Wear Engine 使用入门](https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/dev-process-0000001051058039)：`若为非华为手机，则需同时装有HMS Core（APK）`，并允许后台弹界面。
- [Wear Engine FAQs](https://developer.huawei.com/consumer/en/doc/connectivity-Guides/faq-0000001050818031)：授权界面未显示时核对Health版本／初次隐私声明、应用身份签名、授权接入；非华为手机需HMS与Health后台弹窗。
- [Supported devices / Service Introduction](https://developer.huawei.com/consumer/en/doc/connectivity-Guides/service-introduction-0000000000018585)：Other phones支持Android 6.0–14.0；当前Android13在公开范围内。手表列有WATCH FIT 1及后续，不要求必须华为手机，未见小米Mi10专属禁止白名单。型号支持不等于每种API、表侧固件／通信能力均自动满足。
- [Phone SDK Version History](https://developer.huawei.com/consumer/en/doc/connectivity-Guides/version-change-history-0000001086350238)：5.0.3.301要求Health至少13.1.3.300；5.0.3.304至少14.0.12.310。16.1.2.310数字上均超过门槛，不能优先解释成“版本太旧”，但改包功能／身份仍要单独评估。

也保留官方口径差异：[HMS通用适配页](https://consumer.huawei.com/cn/support/content/zh-cn15841699/)含使用运动健康“无需下载HMS Core”的表述；英文通用支持页则说Health部分功能依赖HMS。它们并未明确宣布取消第三方WE接入前提，本问题以WE专属中英文页与FAQ为准；不隐藏差异，也不臆测差异对应哪个地区／Health版本。

## 3. 源码级：授权往哪里走

客户端路径：

`HiWear.getAuthClient → AuthClient.checkPermission → auth.a → bind com.huawei.health/WearEngineExtendService → getBinder(5) → AuthManager.checkPermission`。

客户端部分能力探测另有运动健康ContentProvider `content://com.huawei.healthcloud.health.provider/wear_device_state/wearEngine`，不是HMS Core provider，不能混成授权主体。

Health服务内部先读本地账号 `user_id`，查运动健康协议授权；随后预授权校验调用应用的app ID／权限记录，必要时从Scope服务获取权限，再进入AuthManager授权库。账号为空可返回3，协议未同意7，Scope权限交集为空8；服务把数字放进IllegalStateException，SDK再转换为WearEngineException。**这些分支支持“有多种拒绝原因”，不支持单独绑定HMS就是失败点。**

SDK `WearEngineException` 本来有 `errorCode` 和由错误码生成的message。App `UserFacingError.diagnostic()`只留simpleName，`explain()`又按关键词合并：

| 码 | 原文 | 实际层级 |
|---|---|---|
| 7 | User unauthorized in health | Health用户协议／隐私授权 |
| 8 | Scope unauthorized | 开发者服务权限／应用身份／Scope及缓存校验 |
| 9 | User unauthorized in wear engine | WE特定用户权限未授予 |
| 13 | Device version is not supported | 设备版本／能力支持 |
| 15 | Health does not has permission to start | Health后台自启动限制 |
| 18 | Interface is not supported | 接口能力不支持 |

全部可能变成那句“权限或设备能力未满足”。3（未登录）、6（远端绑定对象空）、12（内部异常）、14（Health版本低）也另有分支，不能从仅有类名选择某一码。

本次点击走 `authorizeAndScan`：checkPermission=true直接getCommonDevice，false才requestPermission；三个失败点共享同一错误出口。官方版本历史还指出可默认授予DEVICE_MANAGER/NOTIFY。故“没弹窗”既不证用户拒绝，也不证checkPermission必失败，先补可观测性比盲装／盲换包更有判别力。

完整调用链解释和方法证据见GitHub `sdk/调用链与错误码.md`；本地大APK/dex及个人原始日志不公开。

## 4. 新变量：运动健康改包（不先入为主）

只读Hash与证书核验：

- 已装外层文件 SHA-256：`436e87e104e150f42e38353aa133b6ce9fc38593eff389752e206a9ece1b5db5`，207803652 bytes，与本地base.apk一致。
- 内层origin.apk SHA-256：`5b7d162abfd2979108672c2b11b063f0c848f4fe60070f41df2e8e26464e54b8`。
- 外层证书SHA-256：`c081890cf2a1adf13e56d7b50a4f3d8edb35b7c46d6ccc732dd997b7e433be1d`。
- 内层证书SHA-256：`b92825c2bd5d6d6d1e7f39eecd17843b7d9016f611136b75441bc6f4d3f00f05`，与SDK的Health签名常量一致。
- LSPatch `sigBypassLevel=2`、`useManager=false`、`overrideVersionCode=false`，含内嵌模块。配置表明存在签名兼容层，但**配置值不能证明运行时hook全部成功**。

SDK会检查Health签名，外层与官方常量不同值得追踪；不过不能简单宣称“签名错必未安装/必报8”，因为LSPatch可拦签名查询，现场至少留有Service binder记录。内层特定方法分析也不等于证明注入模块没有改变结果。

## 5. 真实案例：正文与评论后的结论

1. [Gitee 官方hms-wear-engine-demo，获取不到绑定设备](https://gitee.com/hms-core/hms-wear-engine-demo/issues/I4PCE2)：完整正文与API全部4条评论已核对，第2页空。华为P30/HarmonyOS2+GT2 Pro，作者声明Wear Engine已批、用户回调已经onOk，却在绑定设备查询报Scope unauthorized。回复建议联网和按官方FAQ排Scope；作者后来称已解决，但忘了具体修法。
   - 支持：审批／onOk不保证后续Scope请求通过。
   - 不支持：不是小米缺HMS案例，也没有可复现“装HMS即好”的修法。
2. [Reddit Android13 Health/HMS讨论](https://www.reddit.com/r/Huawei/comments/v8ny1z/huawei_health_hms_apps_on_android_13/)：取得帖文及可见回应，存在加装AppGallery/HMS后Health登录或连接恢复、也有用户仍失败。是Health层弱旁证，不是checkPermission实测。
3. [Reddit Xiaomi14连接讨论](https://www.reddit.com/r/Huawei/comments/1hlik6p/huawei_watch_cannot_connect_to_huawei_health_on/)：帖文说卡注册/登录，可见回应并非同一异常；仅说明小米生态链有相似问题。
4. [WearEngine Bridge作者说明](https://github.com/RandGor/wearengine-bridge)：描述自签客户端Scope unauthorized与Health内包名/证书校验；只取得作者README/源码及发布说明，未见独立讨论复现。不推荐在本机安装或绕过授权。

Reddit匿名原站JSON 403，Exa返回的评论块与元数据总数不一致，因此只声称“可见正文/回应”，不声称抓全全部评论或统计多数比例。检索中没有找到“同版本Health＋本机样本＋同数值错误码，安装HMS后稳定恢复”的直接闭环案例。详细覆盖／失败记录在 `community/coverage.json` 和笔记中。

## 6. 次级假设排序与最小验证

以下是排查优先级，不是未经数据支持的概率排名；WE已审批按用户确认接受，不重新否定审批。

1. **先取失败阶段／原始错误码（必要门槛）**：今夜不改App。后续若授权出诊断版，只加phase、WearEngineException.errorCode、规范错误表message、cause类型／必要的脱敏堆栈；不改授权流程。分别记录checkPermission成功Boolean、requestPermission的onOk/onCancel、getCommonDevice阶段。一次重现即可分叉，不能只保留simpleName。
2. **HMS缺项**：官方要求＋缺包已证，最明确可补环境项。用户批准后，保持Health/应用/账号/配对/权限不变，只装官方HMS，记录安装前后同一阶段和码。成功支持HMS相关（但安装过程若连带登录/同意协议，需承认混杂）；同码失败反驳“只补HMS就能好”，不等于证完全无关。
3. **Health改包／签名兼容层／Scope预授权**：若报8或Service身份异常，先看签名查询与Health鉴权日志。不能悄悄换纯官方Health：签名不同通常不能直接覆盖，卸载／清数据可能损失配对、模块功能与本地记录。仅待明确许可＋备份后设计对照。
4. **应用身份和Scope缓存／网络**：实际elcton证书SHA-256为 `fc08a0b474a8ffca5887bd5c88ac15e865a63a64eca81c10f344496c46d9ad94`。后续对照既有AGC注册的app ID、包名、SHA-256，关注调试签名/安装来源是否一致；有服务已批事实不代表每个装包身份一致。官方FAQ指出Scope缓存可24小时更新；优先等刷新/查网络日志，不执行FAQ中清Health数据／卸载建议。
5. **账号与Health协议态**：实际报3才优先账号；报7查Health协议/隐私同意及服务读取记录。用户看到正常Health账号不等于内部user_id/协议查询无异常；不能把3、7、8、9混写。后续由用户确认现有账号，禁止本次自动登录／退出。
6. **MIUI后台弹界面／启动权限**：官方同症状FAQ明确要求后台弹界面，码15或请求授权阶段受限时优先。仅查看单应用相关设置／日志；修改须另批准。checkPermission或Scope先失败时，不拿“开全部权限”代替诊断。
7. **Health数字版本／WE接口／表侧能力**：16.1.2.310超过最低数字门槛，“太旧”低优先；若报14/18检查运行Health服务api level及实际接口，13检查表侧固件和设备能力。首步授权/Scope尚未过，不先换表或动配对。FIT系列公开支持，但具体P2P能力仍要实际Device数据验证。

## 7. 官方HMS安装与装后验证方案（仅方案，未执行）

即使根因未定，也给出可执行的环境补齐方案，等待用户醒后明确点头。

### 可信入口，不提供猜造APK直链

华为官方《非华为品牌设备如何安装HMS Core》：
https://consumer.huawei.com/cn/support/content/zh-cn15905145/

该页真实链接到华为应用市场：
https://appgallery.huawei.com/#/Featured

官方推荐顺序：优先手机自带商店搜索HMS Core；无结果再安装华为应用市场客户端，从客户端安装HMS Core。商店若有官方包，则不必多装AppGallery。本次未进入小米商店、不保证现在一定有；AppGallery网站直接GET只有SPA壳，未声称验证了HMS详情页、最新版本/包体或签名，更不编造Cxxxx App ID、CDN地址/哈希。拒绝APKPure/来历不明群包/修改版。

### 批准后步骤

1. 先保留现有基线：elcton/Health版本、签名、阶段及错误码；不先改Health、不清数据、不解绑。不要混入自动升级Health或调整权限。
2. 由用户从上述官方路径下载HMS Core，核对开发者为华为、目标包名 `com.huawei.hwid`。若需要新增AppGallery也算额外安装，须纳入许可；无法确认官方包就暂停。
3. 安装普通APK，只对该次安装临时授权安装来源；不root、不刷机、不替换小米服务、不关闭全机安全功能。本机adb安装曾受MIUI USB安装限制，不默认用shell安装绕过，按用户认可的正常安装流程。
4. 首次协议/账号/必要权限由用户阅读决定，不默认全开、不自动退出Health账号。若安装过程改变账号/协议，写进对照记录。
5. 只读确认 `adb -s 127.0.0.1:43111 shell pm path com.huawei.hwid`；`adb -s 127.0.0.1:43111 shell dumpsys package com.huawei.hwid` 核对实际versionName/启用状态。连接端口若变化再只读重连。
6. 用户亲自重试同一按钮；诊断记录分别检查checkPermission、授权回调和设备列表。先以“同一阶段码变化／成功得到实际手表列表”为验收，不把“APK装上”“出现过弹窗”或“Health可打开”当同步已通。P2P同步仍是后续独立验收，不在本方案自动发课表。
7. 若仍错，按原始码分叉，保留失败证据；不连带卸载Health、停用HMS、重配表或乱改权限。回退属于新的删除／变更操作，另问用户。

### 对小米的合理副作用

- 普通应用基础服务，不等于把小米变成华为，不要求替换MIUI/Google服务。
- 增加APK及缓存空间、服务驻留／唤醒、联网和更新成本，可能增耗电；未装未测，不能给内存/耗电百分比或零影响保证。只保护必要单应用，不全机开无限制。
- Huawei ID/协议和隐私处理增加；不同功能权限范围不同，不默认云同步、支付、个性化广告或联系人/短信/无障碍等无关权限。
- HMS与Health可能受MIUI后台限制，装上不保证弹窗/后台链路自动畅通。
- 卸载HMS可能影响依赖它的登录和App功能；不能以“可卸载”冒充无副作用。更不建议卸载当前改包Health做无备份试错。

## 8. 证据与交付边界

GitHub独立分支：`qa/hms-root-cause-20261114`；新目录 `qa/hms-root-cause-20261114/`。报告副本 `HMS根因排查.md`，官方正文/来源与完整性索引、案例正文/评论、SDK方法摘录、只读现场脱敏摘要、发布审计及文件哈希清单都在该目录；未碰master或别人工作的目录。

本地最终报告：
`/storage/emulated/0/Documents/elcton-WearEngine-真机联调-20261113-123000/HMS根因排查.md`

完整个人日志、APK/dex、反编译/模块及未公开账号数据仅保留独立克隆 `.git/hms-analysis/`，不入公开仓、不删旧证据。网页元数据cookie仅去值后发布；原始响应及脱敏前取证在内部证据区保留，不当可用登录凭据。

**最终裁决：官方环境缺项已证；本次根因未定；最小下一步是补错误码／阶段，并在批准后做单变量HMS对照。所有安装、权限、账号、换包和设备操作今晚均未执行。**
