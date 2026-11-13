# Wear Engine / 小米 / HMS / 改包 Health 社区旁证笔记

检索日期：2026-11-14（UTC+08）。仅网上只读调研；未 ADB、安装、登录、配对、改设置、使用前台浏览器或发帖。原始材料均在本目录。

## 结论先行

1. **找到直接 Wear Engine `Scope unauthorized` 的真实问题及完整回应**：Gitee 官方示例仓库 I4PCE2，华为 P30 / HarmonyOS 2 / GT2 Pro。日志显示授权 `onOk` 与 `hasAvailableDevices onSuccess` 后，获取绑定设备仍抛 `WearEngineException: Scope unauthorized`。作者后来称解决，但明确忘记方法，不能作为可复现修复。
2. **找到直接涉及改签 WE 客户端、Health 内 scope 校验的开发者支持材料**：WearEngine Bridge 作者 README/release 描述“手表已配对也会拒绝自签客户端”。这是作者自身项目报告，**不是带独立用户评论的复现**；测试仅 Android 15 / Health 17.0.8.300 / root LSPosed，不能移植推定当前 LSPatch Health 16.1.2.310 的行为。
3. **取得两条有正文及回应的非华为 Health 对照帖**，但都没有 `HiWear.checkPermission`、`WearEngineException` 或 WE 错误码。一个是 2022 Android 13 Beta / Pixel；另一个是 2024 Redmi Note 11 / GT4，已装 HMS 仍 Health 配对失败。它们只证明 Health 层存在多种失败，**不是当前 WE 失败的同类根因**。
4. **未找到“小米 Mi10 Pro + Android 13 + 当前 LSPatch Health + com.hcbiu.elcton v0.2.5/code7 的 checkPermission，同错误码，补 HMS 后恢复”的可复现案例。** 当前现场只有异常类名、message/错误码被吞，连“同错误码”尚无法匹配。不能将缺 HMS、套壳或任一社区说法定为根因。

## 已提供现场上下文（非本次网页取证）

- App `com.hcbiu.elcton` v0.2.5 / code7；Mi10 Pro / Android13；未装 HMS，Health 可以正常配对；`checkPermission` 失败仅留下 `WearEngineException` 类名。
- 父代理已核实官方英文 WE 环境说明要求非华为手机 HMS Core。
- 中途新证据：SDK 的 `checkPermission` **直接 bind 运动健康 `WearEngineExtendService`，不是 HMS binder**；当前 Health 实物为 LSPatch 套壳，含 `cn.wwl.xposed.hook` 模块。展示版本号 16.1.2.310 不等于官方纯包。
- 因此，本笔记不以“Health 能用”等价“WE 能用”，也不以“无 HMS”等价“导致当前 binder / checkPermission 错误”。官方条件、SDK实现与当前包完整性是不同证据层。

## 案例 1｜直接 WE 授权错误：Gitee「获取不到绑定的设备」

- URL：https://gitee.com/hms-core/hms-wear-engine-demo/issues/I4PCE2
- 首帖：2022-01-04 18:16:32 +08；作者 qhs1573；最近更新：2024-09-28 14:32:56 +08。
- 正文覆盖：公开 API 完整 `body`，并取得网页 HTML；非仅搜索标题。
- 回应覆盖：issue API 宣告 **4** 评论，评论 API 实得 **4**，第 2 页为空。API 状态仍为 `open`；不能因状态未关闭否定作者自述。
- 原始文件：`gitee-issue-api.raw`、`gitee-comments-api.raw`、`gitee-comments-page2.raw`；可读全文：`gitee-I4PCE2-primary.md`。

### 原文与现场

> 按照例子我导入到AS之后替换了我自己的申请的包名和APP_ID 然后我运行后log信息如下请问我哪里没整对

关键日志顺序：

```text
getAuthClient onSuccess
getAuthClient onOk notify
getAuthClient onOk device_manager
getAuthClient onOk sensor
hasAvailableDevices onSuccess
//获取绑定的设备这里一直会失败异常如下
com.huawei.wearengine.WearEngineException: Scope unauthorized
```

> 手机端使用的是华为P30 升级到鸿蒙2.0系统了 穿戴设备端用的是GT2_PRO

### 全部回应及不同观点

- **Mike-mei，2022-01-05 14:52:30 +08**：
  > 请确保手机在进行开发测试时已连网。
  > 可参考华为开发者联盟以下网址FAQ中的“接口调用时返回 Scope unauthorized 错误信息”进行排查处理。
  > 如仍有问题，请参考FAQ排查指导中的在线提单……
  链接是官方 FAQ 的 scope unauthorized 段落，不是“安装 HMS 必好”的回复。账号名不能单独作为其职务已核实的证明。
- **首帖作者 qhs1573，2022-06-09 09:00:44 +08**：
  > 后来搞定了，怎么搞定的忘记了 :smile:
  仅有结果自述，没有修复步骤、前后错误码对照或复现日志。
- **meishijuhe，2024-03-20 11:13:10 +08**：
  > 怎么申请WearEngine服务啊? 申请老是被驳回 没有申请成功是不是也搜不到设备?
  这是追问/推测，不是确定因果。
- **胡爷，2024-09-28 14:32:56 +08**：
  > 同问

### 相关度与限制

直接 WE 层高相关：确有 `WearEngineException`，并显示“前一步成功”不保证后一步 scope 校验成功。**但错误接口是获取绑定设备，不是已明确展示的 checkPermission；设备是华为 P30，不是小米；没有无 HMS 对照。** 官方旧 Android 结果表把 scope 校验失败定义为 8，帖子却未打印数值，只能说“消息与 error8 语义对应”，不能谎称作者实测记录了 8，也不能认定当前未知异常就是 8。

## 支持材料 A｜直接 WE 改签支持，但没有独立评论：WearEngine Bridge

- 项目原文：https://github.com/RandGor/wearengine-bridge
- README：https://raw.githubusercontent.com/RandGor/wearengine-bridge/main/README.md
- 模块目录：https://modules.lsposed.org/module/ru.randgor.wearenginebridge/
- 创建时间由 GitHub API 核：2026-10-02 15:57:55Z；0.1 源项目 release：2026-10-06 06:40:40Z。模块目录显示的本地化时间与另一仓库 release 不是本笔记的统一时间基准。
- 正文覆盖：取得完整 README、module description 与 release API。
- 评论/回答覆盖：项目公开 Issues API（state=all）返回空数组，repo `open_issues_count=0`；**没有独立 Issues 评论可引用**，Discussion 回应不可见。本项不计入“有正文+评论”的三条案例。
- 原始：`wearengine-bridge-readme.raw`、`wearengine-bridge-repo.raw`、`wearengine-bridge-releases.raw`、`wearengine-bridge-issues.raw`、`extract-direct-reference-final.json`。

作者原句：

> A modified client signed with your own key can be rejected at this check, preventing it from reaching the watch even when the watch is paired with Health.

其声称针对 Health 的 `:DaemonService` / `:PhoneService` 内：

```java
boolean com.huawei.wearengine.scope.ScopeManager.checkScopeAvailability(
    String scope, int clientPid, int clientUid, String channel)
```

README 自述仅为 `scope=com.huawei.hiwear.devicemanager` / `channel=wearEngine` 放过 scope gate，且：

> This bypasses the selected scope gate, not just its certificate comparison.
> Separate Health consent and watch-side installation checks are not changed.

测试边界同样写得明确：参考 Health **17.0.8.300**、Android15 / Magisk31 / Vector/LSPosed；作者称已确认模块安装和运行，其他 Health 未测试，HAP 安装未独立确认。**本次没有核其源码正确性或实际设备结果，也未安装任何模块。**

相关度：能提供“已配对≠第三方 WE 客户端通过 Health scope 校验”的直接机制线索，以及改签客户端的支持案例。**它说的是客户端改签，不是 LSPatch 重包 Health 导致失败**；与当前 `cn.wwl.xposed.hook` 也无已知同一性。仅作后续静态核对方向，不能据此指控当前模块或建议执行绕过。

## 案例 2｜仅 Health 层：Reddit Android13 / HMS 闪退与配对

- URL：https://www.reddit.com/r/Huawei/comments/v8ny1z/huawei_health_hms_apps_on_android_13/
- 首帖：2022-06-09 18:53:44 UTC；xH3CAT3x。可见回应跨度至 2023-01-04。
- 正文覆盖：Exa 可访问提取获得首帖全文。
- 评论覆盖：实际核对 **19 个评论块**；Exa 首帖元数据却写 **18 comments**。**实时完整总数无法确认**，19 是本次取得文本的展示块数，不冒充 Reddit API 总数。原生 web_extract 的第一帖在第 15 个块处截断，不能用其“19 shown”当完整覆盖；分析采用保存的 Exa 返回。
- 原始：`reddit-exa-accessible-extract.md`；对照/截断记录：`extract-health-threads.json`。

首帖：

> I just updated to android 13, now I can't pair my huawei band 6, and HMS core keeps crashing. Tried 6.0.0.5.301 or something similar but still nothing.

注意版本号带 **“or something similar”**，不是确认过的 6.0.0.5.301。

不同回应：

- **salixor，2022-06-10**：`Same issue after upgrading from Beta 2 to Beta 3 on my Pixel 5.` Watch Fit 无法配对；**devilmansam，2022-06-16** 说 Pixel6 / Band6 也发生。
- **salixor，2022-07-13**：
  > Beta 4 fixes the issue ! It was indeed an A13 issue with bluetooth in the end
  这是该用户归因，不是本研究核实的 Android 蓝牙根因。
- **ComprehensiveBus5636，2022-07-19**：
  > the latest update of huawei health fixe that problem. 12.1.6.352-wearBeta
  与“Beta4 修复”并列，是不同版本/处理自述，不能合成单一结论。
- **BenSF93，2022-08-23**：称 HMS Core 尚不支持 Android13、预计十月；内容明确提到 **Huawei Health Kit sync**。这段未独立核官方原文，不是 WE 权限失败证据。
- **Icy-Maintenance-2317，2022-08-31**：
  > I downgrade to HMS Core 6.0.0.305 and Health Sync to 7.3.7
  > I can sync my activities now on my Pixel 6
  同时改变两个版本，只涉及活动同步。
- **Brilliant_Cow9882 / catalin-84 / jdpixel032021，2022-12 至 2023-01** 仍报告配对失败，说明不同用户与更新组合没有统一恢复结果。

相关度：非华为 Android13 的 Health/HMS 兼容性历史旁证；**2022 Beta/旧版本，不是当前稳定 Android13 + Health16 实物；没有 WE API、error7/8/9 或套壳信息**。不得引用“Health Kit sync 需要 HMS”推断 `WearEngineExtendService.checkPermission` 此时必因缺 HMS 报错。

## 案例 3｜仅 Health 层：Redmi Note11 已装 HMS 仍配对失败

- URL：https://www.reddit.com/r/Huawei/comments/1hlik6p/huawei_watch_cannot_connect_to_huawei_health_on/
- 首帖：2024-12-24 17:44:03 UTC；Obvious-Optimus。
- 正文覆盖：首帖全文。
- 评论覆盖：实际取得并核对 **2 个评论块**，均 Old-Gold2591，时间为 2024-12-27 19:15 UTC、12-28 12:41 UTC；首帖元数据写 **0 comments** 与后续文本冲突。**2 是可见提取数，实时全量未知**。
- 原始：同上 `reddit-exa-accessible-extract.md`，原生提取也保存了这两条。

首帖原文：

> I try to pair my Huawei Watch GT4 to my Xiaomi Redmi Note 11. Huawei Health and HMS Core installed App Gallery and both up to date.

> ... they are shown to be connected in the phone settings, but on the watch and in the Huawei Health app it says unsuccessful pairing.

帖主已尝试重置、重装 Health/HMS、重启和取消蓝牙配对，仍失败。版本号、OS 和“up to date”的精确依据未给。

回应原文：

> Me pasa exactamente lo mismo. Acabo de comprarlo y no se conecta.

次日同一回应者：

> Hasta que empareje el reloj con otro telefono, ahi, una vez que pude abrirlo, lo actualice desde el mismo reloj.
> ... se emparejo perfecto.

中文转述：回应者称先与另一手机配对，在手表上更新，再尝试原手机的蓝牙连接后成功。**不是首帖作者确认，也没有设备/固件前后版本或独立复现**；本次不执行其建议。

相关度：小米 + 华为 Health 的真实失败/回应，反对“装 HMS 就包治配对”的简单化；但连 Health 配对都没成功，和当前 Health 已正常配对、第三方 WE 失败不同层，不能做根因对照。

## 权限错误码边界：不能从类名推数值

此次读回旧 Android 官方结果表及 FAQ：

- 结果码：https://developer.huawei.com/consumer/en/doc/connectivity-guides/errocode-0000001054450278
- FAQ：https://developer.huawei.com/consumer/en/doc/connectivity-guides/faq-0000001050818031
- 原始：`extract-direct-reference-final.json`。

旧 Android 表分别定义：**7**＝用户未同意 Health 用户协议/隐私声明；**8**＝scope permission verification fails；**9**＝WE 用户授权校验失败或未调用对应授权 API。它们都是不同机制，`WearEngineException` 类名不足以任选一个。新 ArkTS 的 100850xxxx 也不能直接移作当前 Android SDK 错误码。

Gitee 对应 8 的消息语义最接近；未取得 error7/error9 的同配置、带数值和复现步骤的社区病例。对当前未知数值不能声称“同码”。

## 检索与可见性边界

- 已加载 agent-reach；本机 `agent-reach` / `mcporter` / `rdt` / `opencli` 均不在 PATH。因此使用 deferred **Exa search/fetch**，交叉 **原生 web_search/web_extract**，关键 Gitee/GitHub 用**直接公开 API**读回。
- 定向检索包括 `WearEngineException checkPermission`、`Wear Engine Xiaomi/小米`、`HiWear 小米`、scope unauthorized / error7/8/9 授权、LSPatch，以及 StackOverflow/华为论坛/CSDN/V2EX。HiWear 搜索有无关同名消费 App，已排除。
- StackOverflow 找到 get-token `ApiException:907135003` 的正文/答案，但它是 HMS token API 而非 WE，本笔记不将其凑成有效案例。原 API 取证留在 `stackoverflow-api.raw`。
- CSDN 未获得可作为当前 `checkPermission` 失败直接旁证的完整正文+有效评论。V2EX结果主要是健康数据同步/手环选择，不足以匹配授权层，未扩大抓取。华为论坛读到的 GT Runner 帖含完整问题、2条顶层回复和1条楼内感谢，但主题是开发安装/审批而非错误复现，留作筛除材料，不计有效案例。
- Reddit 本机无登录后端；直接匿名 `.json` 实测 **HTTP403 Blocked**，记录在 `http-direct-capture-log.json` / `reddit-direct-anonymous.raw`。未登录、未绕过访问控制；可访问页面提取仅作为有限可见材料，不伪造评论，也不以冲突元数据定全量。
- Exa 抓 Gitee反复 `CRAWL_TIMEOUT`，改公开 Gitee API 成功。正文与评论覆盖以 API 为准。
- 按时间盒与中途指令停止继续通用搜索；这是有限范围“未找到”，不是宣布网络上不存在。

## 对父代理的可用旁证

**可以用**：Gitee证明 WE scope 检查可能在前序授权/设备可用成功后失败；Bridge作者支持稿提示 Health内 scope/客户端身份是独立关口；两条 Health帖说明兼容、配对、同步、WE授权层必须分开。

**不能用**：由社区推定缺 HMS为根因、推定LSPatch模块破坏WE、把改签客户端当改包Health实证、把套壳16.1.2.310当官方纯包、把未知异常强归7/8/9，或把作者“搞定了”写成可复现方案。

交付：本文件、`coverage.json`、`source-index.md`、Gitee正文/4评论、Reddit正文/实际展示19与2条评论、Bridge作者原文及原始API/检索返回。所有文件仅写指定 `community/`，无 Git 提交或推送。
