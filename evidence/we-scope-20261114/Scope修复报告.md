# Wear Engine Scope 修复报告

状态：未修复；认证阻塞。当前应用的最新审批 Scope 尚未读到，不能宣称已补授权或真机已恢复。

目标仅限 Android hc课程表，APP ID `118599721`，包名 `com.hcbiu.elcton`，项目 hc课程表 / `101653523864732872`。本轮 Scope/API 授权修改为零；证书、Profile、签名、App 代码修改为零；没有装机、拉起手机 App、点屏、清运动健康数据或卸载。复测仍由发起方执行。

工作证据：`lantianhcgp/elcton` 独立分支 `fix/we-scope-118599721-20261114`，目录 `evidence/we-scope-20261114/`。下文相对证据路径均指该目录。原始交付目录和历史报告未覆盖。

## 一、这次证实了什么

1. 发起方提供的真机日志确实记录了 `getCommonDevice` 的 `WearEngineException [errorCode=8]: Scope unauthorized`。同一次调用 SDK 自报 API 名 `device_get_common_device`，服务 API level 14、最低支持 level 8。错误发生在 Scope 校验层，不能归因为“服务根本没在线”。
2. 控制台公开前端的申请页、详情页使用同一能力权限组件。设备列表和 P2P 的公开权限是“设备基础信息 / DEVICE_MANAGER”，对应 Scope `com.huawei.hiwear.devicemanager`，不是逐条勾选 `device_get_common_device` 的 API 清单。
3. 旧 04 报告仅将 `powerList` 和 `inAuditPowerList` 列为“获批权限”，但脱敏证据只保存了其他审批字段的键名，没有保存 `passedPowerList`、`betaPowerList`、`approveStatus`、`stateRange` 的值。这不足以证明它们的批准状态，也不能反推这些字段为空。
4. 官方 FAQ 明确给出了“已经审批通过仍返回 Scope unauthorized”的另一种情况：审批前调用过接口，运动健康仍缓存“未申请权限”的记录，每 24 小时自动刷新一次；手机必须联网更新 Scope。此原因是有官方依据的候选，尚未在这台手机上证实。

因此，日志证明 Scope 校验失败，但不能单凭 errorCode=8 判定“漏了一个 API 开关”。本轮没有否定用户已确认的服务获批事实；待补的是批准范围的精确读回和实际缓存状态。

## 二、原核对记录究竟核了什么、漏了什么

历史查询时间为 2026-11-13；不是今天的服务端状态。

| 项目 | 历史证据实际保存的结果 | 本轮评价 |
|---|---|---|
| 身份 | APP ID 118599721、Android 包 com.hcbiu.elcton、目标项目一致 | 原身份核对已做，不重建应用 |
| Android 签名指纹 | 旧 04 记录追加并精确回读手机 APK 的 SHA256 公证书指纹 | 本轮不触碰，也不重复登记 |
| Account Kit | service32 查询返回启用 | 不是 Wear Engine 的 Scope 清单 |
| Wear Engine 服务 | service1062；openState=3，页面“已开通”；total=1、返回=1、目标=1 | 证明历史服务层已开通 |
| 请求/审核中权限 | powerList、inAuditPowerList 均含 com.huawei.hiwear.devicemanager | 不能仅凭两个字段的名字称“批准范围已完整核实” |
| 批准/测试/地区相关字段 | attrs_keys 中存在 passedPowerList、betaPowerList、approveStatus、stateRange | **值未保存，unknown；不是空值** |
| 实际运行 | 原 04 明确不代表真机通信已通过 | 新真机日志已将问题缩小为 Scope8 |

精确历史证据：`historical/agc-readonly-20261113-wear-grants.json`、`historical/agc-readonly-20261113-wear-service-page.json`，原 01/04 快照也保留。没有把历史成功结果填入今天的读取失败结果。

## 三、Scope/API 逐项清单

本轮只读 0.2.6/code8 分支 `feat/diag-mcp-026` 的 WearProbe.kt，源码提交 `cd2a3e062b97d778c79b76b544071b1077534af7`；未改源码。源码链接：
https://github.com/lantianhcgp/elcton-phone/blob/cd2a3e062b97d778c79b76b544071b1077534af7/app/src/main/java/com/hcbiu/elcton/WearProbe.kt

| 调用/用途 | 0.2.6 使用情况 | 官方能力权限 | 最新服务端批准值 |
|---|---|---|---|
| getCommonDevice；SDK 日志名 device_get_common_device | 当前设备扫描使用；此次报错点 | DEVICE_MANAGER / com.huawei.hiwear.devicemanager | unknown：认证未通过 |
| checkPermission(DEVICE_MANAGER) | 扫描前使用 | 查询 DEVICE_MANAGER；官方要求该权限审批通过，否则可能 error8 | unknown |
| requestPermission(DEVICE_MANAGER) | 查询 false 后使用 | 用户授权层；不是开通云端 Scope 的接口 | unknown |
| getBondedDevices | 用户要求核对；当前 WearProbe 改用 commonDevice，未直接调用 | DEVICE_MANAGER | unknown |
| P2pClient.isAppInstalled | 当前连接链使用 | DEVICE_MANAGER，依据官方 P2pClient 类范围说明 | unknown |
| P2pClient.registerReceiver / unregisterReceiver | 当前收发/收尾使用 | DEVICE_MANAGER | unknown |
| P2pClient.send（消息） | 当前同步与导出请求使用 | DEVICE_MANAGER | unknown |
| P2pClient 消息/文件传输能力 | 官方定义包含双向消息和文件；当前 send 发送消息分包 | DEVICE_MANAGER，不是 NOTIFY | unknown |
| setPeerPkgName / setPeerFingerPrint | 当前 P2P 参数设置 | 对端身份配置，不是单独 Scope 授权开关 | 不适用；本轮不修改签名 |
| ping / getRemoteAppStatus | 当前该源码未直接调用 | 不为不存在的当前调用盲加权限；ping 属 P2pClient 类权限，getRemoteAppStatus 精确映射未核实 | 未补权限 |

官方权限组件列出：devicemanager、notification、wearuserstatus、motionsensor、sensors、startremoteapp，共六个 Scope。见 `frontend/scope-list-excerpt.txt` 和 `frontend/source-verification.json`。申请/详情代码均引用该组件；这项“无逐 API 勾选”的结论限于已读取的页面，不声称穷尽所有华为后台。

- NOTIFY 是模板化通知，不是课表 P2P 的必需项。
- 用户状态和传感器 Scope 与当前课表链无关，不补。
- 前端存在 startremoteapp 不等于当前 Android 发送链必须申请；当前源码没有自动远程拉起，不盲加它。
- SDK 内部字符串与公开方法的关系由本次调用日志印证；没有另取得华为内部 API→Scope 映射表。

## 四、认证实测与为什么没有修改

| 本轮动作 | 真实结果 | 证据 |
|---|---|---|
| 复用另一既有 profile 和之前验证过的会话 | 精确 projectList 查询 HTTP401 | session-before.json、session-prior-verified-probe.json |
| 一次安全填密/提交 | SLIDER-WAITING；没有自动拖验证码 | login-selfheal.json |
| 提供 127.0.0.1:8777 人工视界 | 服务和图像响应已验证；等待用户反馈未完成 | 安全视界工具；后续已关闭，不是现在可用的链接 |
| 回查上一轮真实 profile | 昨天成功的 profile 为 hw_watch/agc-cert/chrome-profile，不是另一任务默认 profile | 切回原 profile 验证，未删任何 profile |
| 原 profile 的精确查询 | HTTP401 | session-original-profile.json |
| 原 profile 一次安全自愈 | submitted=true、TIMEOUT、authenticated=false | login-selfheal-original-profile.json |
| 最后认证诊断 | 仍是华为账号登录页；验证码组件显示“加载失败，点击重试” | login-original-final-diagnostics.json |
| 最后精确查询 | HTTP401，verified=false | session-after-original-selfheal.json |
| Scope 读取脚本 | 因登录挑战未完成拒绝，mutation_attempted=false | grants-blocked.json |

这不是“证书/Profile/签名丢失”，也没有证据表明密码错误。401 表示本次请求没有被服务端接受为已认证；本地 profile 和凭据仍保存着不等于服务端会话有效。Health csrf 也不能替代华为账号认证。

为避免重复登录触发风控及持续占用手机资源，本轮没有继续循环提交、刷新验证码、绕过登录或使用证书接口探活。

## 五、前后状态与回滚

| 配置对象 | 修改前当前值 | 本轮写入 | 修改后当前值 | 回滚 |
|---|---|---|---|---|
| 118599721 / service1062 Scope及审批字段 | 因认证失败未读到；历史值另表列出 | 无 | 未读到；不伪造为历史值 | 无变更，不需要回滚 |
| 其他项目/应用 | 未操作 | 无 | 未操作 | 不适用 |
| 证书/Profile/签名/App源码/手机数据 | 未修改 | 无 | 未修改 | 不适用 |

独立分支只新增调查证据和工具。本轮不能提供一次真实 Scope 写入的“前后截图”：写入没有发生。若后续发现确实缺批准项，必须先保存该应用完整批准字段的白名单快照、原勾选项、原审核状态和服务标识，保持所有无关项原样，再仅追加 DEVICE_MANAGER。权限变更可能重新进入审批，**不能保证一键回到原批准状态**；后续撤回/反向修改的可用性必须在真实页面核实。

## 六、生效条件：传播、保存、审批、发版

1. 官方 FAQ 原文：“本地已缓存的未申请权限的记录未更新（每24小时自动刷新一次）”。24小时指运动健康的本地缓存刷新周期，**不是所有服务端 Scope 变更的统一传播时限**。本台手机上缓存的生成/刷新时间未查到。
2. 同 FAQ：“手机需要联网来更新Scope权限信息”。联网要求有正文依据；本轮未进入手机检查或修改网络限制。
3. 官方申请正文：“需要修改相应的数据权限，您可以点击‘修改’重新提交申请”；“权限审批一般需要1到2周”。修改是重新申请审批，不是重复保存立即获批。
4. 官方顺序为：“如果审批通过，即可进入开发测试阶段，完成开发测试后即可发布”。没有找到“必须先发版才能在测试中使用已批准权限”的依据，本轮不发版。
5. 云端新 Scope 配置传播时限、approveStatus 数字枚举含义、betaPowerList 是否满足本构建、stateRange 实际范围：当前未读到/未证实，均为 unknown。
6. 旧 04 的 Android 指纹“约10分钟生效”是指纹登记规则，不是 Scope 缓存规则，不混用。
7. FAQ 提到清运动健康数据或卸载重装作为刷新方法；这些会动用户数据，本轮**没有执行，也不作为自动复测要求**。发起方可先在保留数据的条件下观察联网刷新；需要清数据须另获许可。

## 七、必须人工时的精确操作单

本轮卡在账号认证，人工只需先恢复登录；以下 Scope 操作为有条件核对，不要求用户盲目重新申请。

1. 登录华为开发者联盟 https://developer.huawei.com/ 。若使用远程视界，需重新启动本任务的浏览器/视界；8777 已关闭。验证码由本人完成。不要将验证码、账号密码或 Cookie 发入聊天、报告或 Git。
2. 在 APP ID/项目管理确认项目 **hc课程表 / 101653523864732872**，手机侧 **Android hc课程表 / 118599721 / com.hcbiu.elcton**。不要选表端 watchapp.nexus.0zzip 或兼容旧应用。
3. 进入 **应用服务 → 开发服务 → Wear Engine**。官方入口：https://developer.huawei.com/consumer/cn/service/health/gray/wearEngineService.html 。若该卡片未显示，按官方指引从“开发服务”右侧图标添加卡片。
4. 找到 **Android应用 118599721** 的服务详情，先记下状态、APP ID、包名及权限勾选。所需项准确为 **设备基础信息（DEVICE_MANAGER） / com.huawei.hiwear.devicemanager**，不要找不存在的逐 device_get_common_device 开关。
5. 通过同一已认证会话精确读取 service1062，保存 `powerList`、`inAuditPowerList`、`passedPowerList`、`betaPowerList`、`approveStatus`、`stateRange` 的**值及类型**，并核对 serviceItem、prodType、prodID、包名和计数。工具 `tools/scope_health_init.js` 只初始化 Health csrf；`tools/scope_grants_readonly.js` 只读该应用。详情前端调用 `getAppServiceDetail({appID:'118599721'})`；不要上传整页 DOM、redirectInfo.secret、下载资料链接或原始 Cookie。
6. **如果 DEVICE_MANAGER 已明确批准：不修改、不关闭、不重提、不补 NOTIFY/startremoteapp。**把批准字段给发起方，与手机侧 Scope 缓存线并行判断。
7. **只有确认未申请/未批准 DEVICE_MANAGER 时**才在该应用点击“修改”，保留所有其他原勾选、地区和材料，仅补“设备基础信息（DEVICE_MANAGER）”；提交前保存原状态、确认仍是118599721。若仍需补材料、改变地区/兼容对象，或回滚方式不明确，停下交用户决定，不扩展授权范围。提交后再次读同一对象，记录申请编号/状态；待审不叫“已授权”。
8. 若批准字段仍明确批准却持续 Scope8，官方路径为开发者联盟 **在线提单 → HMS Core → 穿戴能力**，提供 APP ID118599721、包名、此错误和脱敏日志。不要为此重签包或乱开其他权限。

## 八、证据清单与验收边界

- `realdevice/scope-error-excerpt.txt`：发起方原日志第17、18、21、22行逐字节文本节选；`realdevice/provenance.json` 保存原文件哈希和大小。原日志为254020字节，SHA256 `9d130adfc476d39aad6b5b326b3a9b31e47ec997ac5c69771e74d95b6e9c5377`；完整日志留在原交付目录，不把其他应用日志公开。
- `historical/`：01/04及当时的服务/权限白名单查询结果，只作历史。
- `frontend/`：公开页面源码与 Scope 列表，本轮从华为 CDN HTTP200重新下载比对，六个 JS 文件逐字节一致。
- `official/`：本轮真实取得的五份华为公开正文 JSON + 文本：FAQ、申请服务、请求用户授权、Permission、穿戴设备信息查询；均 HTTP200、code0、正文非空。
- 根目录认证失败 JSON：真实401/滑块/超时，不混入测试 fixture 或合成成功响应。
- `tools/`：受限读取/安全自愈/视界/正文抓取和验证工具；工具测试只证明本地安全逻辑，不代表服务已修复。
- `review-closeout.md`：证据准确性审查无发现；安全审查曾发现两处工具限域缺口，发布前已补精确表达式哈希白名单、禁用未脱敏截图导出、人工输入仅限登录页可见验证码区域。加固仅本地测试，未重新启动浏览器或声称实时授权成功。
- `closeout.json`：Browser.close 后本机9233/8777监听与真实Chromium/视界进程残留检查。
- 分支推送及远端读回结果另存 `Scope修复远端读回.json` 于原交付目录；必须与实际分支提交、完整证据树逐文件比较，不用推送成功代替读回。

当前结论保持：**服务Scope校验错误已实证；最新批准Scope未读取；控制台未修改；真机未复测。**

## 官方正文链接

- FAQ：https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/faq-0000001050818031
- 申请服务：https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/applying-wearengine-0000001050777982
- 用户授权：https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/requesting-user-authorization-0000001050819181
- 权限对象：https://developer.huawei.com/consumer/cn/doc/connectivity-References/permission-0000001059433005
- 设备列表：https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/device-connection-management-0000001050779152
