# Wear Engine Lite：SEND_0 / native 回调 / 版本分流定向取证

## 结论先行

**本轮未证明新的注册或对端身份产品回归，也未治好真实握手。** 已闭合的是官方 JS 回调契约、基线诊断丢失和阶段文案覆盖。真实设备的 native availability、原始失败双参数及 HELLO→READY 连通仍为 **unknown**。不建议据此猜改 identity/config；后续 canonical 206、仅记录两参数的数字值/类型/有无、保留 REG 摘要都应明确标为诊断改善，不是故障已治。

1. **`SEND_0` 不是官方消息发送成功码。** 固定基线 `83d58a8` 的 `wearService.js:12-14,98-99` 只取 `fail(d,c)` 的第二参数；缺失、字符串、对象、NaN/Infinity 都变成 `0`，第一参数 `d` 全部丢弃。因此截图的 `SEND_0` 无法区分“native 实际传 0”“根本没传第二参数”“第二参数类型不是 number”。
2. **真正官方 JS wrapper：一旦 native 走 `fail(errorMessage, code)`，调用 `onFailure()`，并传 `onSendResult({data:errorMessage, code:206})`；第二参数 `code` 根本没有参与决策。** `success` 分支才映射到 `207`。第一参数不做字符串化、不解析、不校验类型，原样赋给 `data`。它可能保留底层诊断，但**现有真机材料不能确定第一参数真的含数字返回码、更不能猜是哪一个码**。
3. **截图没有 SDK/REG 文案不证明未协商或未注册。** 基线 `phone-sync.js:151-159` 注册成功后先显示 summary，再用本地构造的 HELLO 生成主动 READY；`:162-167` 的 `reply()` 发送失败会立即覆盖 detail 为“回执失败 SEND_0”。最小实跑已复现 `SDK401|VER|PKG|CERT|REG → 回执失败 SEND_0`，且未注入任何入站 HELLO，通道仍注册。
4. **官方版本分流已确定；目标固件 native 导出 availability 未确定。** 官方构造器调用 `getWearEngineVersion({complete, sdkVersion:'3'})`，取返回字符串最后一段；服务尾段 `>=401` 的 send/subscribe/unsubscribe 走 `@system.wearengine`，否则走全局 `FeatureAbility`。不能因 SDK 文件版本 `5.0.2.306` 便推定实际服务尾段=306，也不能从 `SEND_0` 推定走了哪个 bus。
5. 只读执行：**10 项契约观测全部通过；1 项候选诊断保真 RED 按预期失败（actual=SEND_0）**。没有修产品代码、没有设备操作、没有 commit/push。

## 范围与证据层级

- 目标上下文：FIT3，父提供的手表候选 1.1.15、构建 `73c7823`；手机 0.2.9 HELLO→READY 超时、206、`device.p2p_capability=0`。这些是父提供事实，**本次未读手机或重新采集真机**。
- 产品源码与测试均固定 `83d58a8`，不是共享工作树中父正在修改的版本。三份基线快照放在本目录 `baseline-*.source.txt`，精确行号下文适用这些快照和该 commit。
- A·官方正文/下载 SDK 与 L·基线源码事实、T·Node 明示回调夹具严格分开。Node 不是 native、蓝牙、JerryScript、真机注册/文件系统证据。
- 仅写 `/data/data/com.termux/files/home/we-handshake-repair-20261115-watch/qa/we-handshake-20261115/research/`。官方 SDK 的只读下载/解包用于取证，未安装。

## 最后定向核对：未发现可证实的新 identity / 注册回归

- 手机 0.2.9 源码 `app/src/main/java/com/hcbiu/elcton/WearProbe.kt:86-89,144-145,167-168`：显式 `identify()` 设置 peer package/fingerprint，且在应用检查和接收器注册前调用；注册成功按当前 receiver/generation 判定（`:150-182`）。**不能以“未配置 identify”解释当前失败。** `send()` 不另行重配 identity（`:199-208`），这本身不是已证实回归或修复理由。
- 对照手机旧版 `2097f32`→本地 0.2.9 HEAD `bb26c64`：peer 常量未改，AndroidManifest 的 HMS appid 未改；代码重构为 application-context adapter 和 generation 守卫是真实变化，但没有本次真实双端事件证据证明它导致注册失效。
- 已有 0.2.9 本地构建产物取证 `evidence/apk/index-and-identity.json:2-8,15-28` 给出 APK、构建 commit 和 DEX 中 peer 常量；`evidence/apk/selected-smali/com/hcbiu/elcton/WearProbe.smali:991-1013` 保留 identify 的双 setter 调用。`evidence/phone-0.2.9/build-to-head.diff.json:8-19` 记录相关构建源码到 HEAD 无差异。**这些是现成的本地产物证据，不证明该 APK 就是真机当前安装字节。**
- 手表签后身份/路由已有门禁：`qa/p2p-ready-20261114/final_gate.py:53-70,78-79` 验证 signed.bin header bundle、签后 config 与既有基线（仅版本变更）、manifest pages 和未改的非 config 资源；`qa/p2p-ready-20261114/evidence/actual-hap-local-gate-73c7823.json:3-19,33` 保存通过回执。未据此找到新的 `module.package`/manifest/app-header 静态回归；**该门禁不验证 native P2P 取哪个身份字段或真实固件路由。**
- 旧 `qa/p2p-ready-20261114/evidence/actual-dual-identity.json:2-11` 仅证明历史公开签名身份配对；`qa/p2p-ready-20261114/evidence/local-package-delivery.json:11-14` 的手机是 **0.2.8**，不能冒充 0.2.9 真机身份闭环。

以上核对只读，未要求改 identity/config，未执行设备操作。真实失败根因仍未闭合，原始 native 双参数留待下一次真实取证。

## SDK 的官方身份已闭合，不只是样本版权头

从官网 Lite SDK 页面公开链接取回 5.0.2.306 ZIP，无认证。官网表格 SHA-256 与实算完全一致：

```text
ZIP SHA256: 64130a347647f00d734662523b5a26daca015e87ece7d5d916f19753759a1b56
wearengine.js SHA256: 8c7f1100c840abdb237991b0d436ef9ab49a215269c5fecdb3dd59fe63a71471
```

ZIP 中 `wearengine-litewearable-5.0.2.306/wearengine.js` 与本仓 `references/source-apps/腕上词典-FIT3/entry/src/main/js/default/common/wearengine.js` **逐字节相同**，不是仅规范化换行相同。校验见 `sdk-authenticity.json`。ZIP 只有 JS、目录和 JS checksum，不含 native C/C++ 实现或 d.ts。

官方 JS 全文副本：`official-sdk-5.0.2.306.source.txt`，564 行，行号与仓内 FIT3 参考相同。Apache-2.0 头保留。

## 证据登记（本表是引用事实源）

以下相对路径均相对本报告所在目录；`L*` 源码路径相对仓根。

| ID | 出处 / 精确行 | 重要原文或源码 |
|---|---|---|
| S1 | `official-sdk-5.0.2.306.source.txt:24-35` | `MSG_ERROR_SEND_FAIL: 206`，`MSG_ERROR_SEND_SUCCESS: 207`，版本低 `208` |
| S2 | 同文件 `:276-297` | success→`onSuccess()`/207/100%；`failCallBack(errorMessage, code)`→`data:errorMessage`/206/`onFailure()`/0% |
| S3 | 同文件 `:298-315` | `this.version >= 401`：`wearengine.sendMsg`；否则 `FeatureAbility.sendMsg`。双方参数同为 `deviceId:'remote', bundleName:peerPkgName, abilityName:'', message:message.getData()` |
| S4 | 同文件 `:43-76` | `WEARENGINE_SDK_VERSION = '3'`；complete 有数据时 `split('.')` 取最后一段，无数据/抛错 `version=0` |
| S5 | 同文件 `:82-98,104-128` | native setPackageName 的门槛303；setFingerprint 门槛302；配置完成回调用的是 complete |
| S6 | 同文件 `:196-251` | register 时 `version>302` 再 setPackageName；有 data 且 isRegister→onSuccess；文件/文本→onReceiveMessage；无 data→onSuccess。>=401 先 unsubscribeMsg，再 subscribeMsg；否则 FeatureAbility.subscribeMsg；`fail:receiver.onFailure` |
| S7 | 同文件 `:391-397` | unregister 按401分流；调用 unsubscribe 后直接 `receiver.onSuccess()`，不是对端送达确认 |
| E1 | `p2p-cn.text.txt:291-313,349-351,402-449` | “接口调用成功的回调函数”“接口调用失败的回调函数”；示例 `console.log(resultCode.data + resultCode.code)`；register onSuccess 为“注册成功的回调函数” |
| E2 | `result-cn.text.txt:487-549` | Lite 侧“发送消息失败” `MSG_ERROR_SEND_FAIL`=206；“发送消息成功” `MSG_ERROR_SEND_SUCCESS`=207；低版本208。此节未列0成功 |
| E3 | `faq-cn.text.txt:86-99` | 206 候选原因：包名/证书指纹不匹配、表应用不在前台、任一侧未注册接收器、消息为空、蓝牙未连接 |
| E4 | `js-history-en.text.txt:9-45` | 5.0.2.306 新增 phone-system 查询；5.0.2.300 新增运行时包名/指纹配置；早期5.0.0.300 已支持 P2P 文本。SDK版本、固件版本不是 native 服务尾段401同一标尺 |
| E5 | `p2p-cn.text.txt:36-49` | “10.1.3.28以下版本不支持调用setPeerFingerPrint…请使用config.json配置方式” |
| L1 | `common/wearService.js:12-14,98-99` | `typeof value === 'number' && isFinite(value) ? value : 0`；`fail(d,c)` 只传c给code helper |
| L2 | `common/wearChannel.js:9-11,23-33,44-50` | 只有检测到 version 函数才 delegates app factory；否则 direct native，summary=`UNVERSIONED`。无版本分支 `SEND_0` 只有字符串拼接，不做数值helper |
| L3 | `common/wearService.js:51-67,70-87` | version complete 才配置/注册；基线额外要求**四段全数字**且尾段>=302；注册无 data 或 isRegister 打开通道 |
| L4 | `pages/phone-sync/phone-sync.js:148-168` | 注册成功先 summary，本地 HELLO 触发主动READY；reply失败覆盖detail。这个本地 HELLO 不等于手机 HELLO 已到达 |
| T1 | `sdk-contract-observations.json:6-101` | 7 种官方fail夹具全部206且第一参数保留；5种基线fail观测中0/缺失/string/object都显示SEND_0 |
| T2 | 同文件 `:103-173` | 401/303/302 dispatch、注册事件、额外四段约束，以及 summary 覆盖实跑记录 |

L1/L3 的完整源码前缀为 `entry/src/main/js/MainAbility/`。本目录对应固定快照为 `baseline-wearService.source.txt`；L2 为 `baseline-wearChannel.source.txt`；L4 为 `baseline-phone-sync.source.txt`。

## 原生 fail 双参数：已知与不可越界的解释

官方 wrapper 的决定性原文（S2）：

```javascript
var failCallBack = function(errorMessage, code) {
  var failCode = {
    data: errorMessage,
    code: ErrorCode.MSG_ERROR_SEND_FAIL
  };
  sendCallback.onFailure();
  sendCallback.onSendResult(failCode);
  sendCallback.onSendProgress(0 + "%");
};
```

这里的局部参数名 `errorMessage` 不构成类型保证：代码没有转换它。**如果** native 给 `(16,0)`，官方 onSendResult 会是 `{data:16,code:206}`；**如果**给 `('206',0)`，是 `{data:'206',code:206}`；对象/undefined 也原样保留。这是执行 wrapper 的条件结果，不是假装真机给过这些值。

- native 参数 `code`、JS wrapper 合成的 `result.code`、手机 Java 通用请求结果0、手机 `SendCallback.onSendResult` 的业务206/207是不同层，不能串成一个含义。
- 把 native `fail(...,0)` 改成成功会违背官方 wrapper。`SEND_0` 本身是非空错误字符串，基线目前仍按失败处理；已证实的问题是**诊断证据丢失/混淆**，不是基线把它当成功。
- 官方包装成206并不揭示蓝牙底层原因，也不能将所有原始第一参数都自动解读成 WearEngineErrorCode。即便第一参数为对象带code，也需保存类型与原文，不能猜映射。
- `0%` 是官方发送失败的进度字符串，不是成功码0。

## 版本、availability 与注册：三态判定

| 项目 | 判定 | 边界 |
|---|---|---|
| 5.0.2.306 wrapper 使用 `getWearEngineVersion({complete,sdkVersion:'3'})` | 有官方源码证据支持 | 不证明调用会改变 native 协商状态；可能只是带兼容参数查询，native实现未取得 |
| 401及以上走 `@system.wearengine`，低于401走 FeatureAbility | 有官方源码证据支持 | 是 native**服务返回尾段**，不是 compile API10或JS SDK包版本 |
| FIT3当前固件真的导出 version函数 / 返回何字符串 / 选择何bus | 未知 | SDK下载仅有JS；未取得固件 native源码或真实运行时函数列表，不能推测 |
| SDK wrapper强制四段数字版本 | 不支持此说法 | 官方只取最后一段。基线严格四段限制是产品规则；实跑 `3.401` 官方取401而基线拒绝，但不知道真机会否返回该形式 |
| version方法不存在便应使用 direct wearengine 的UNVERSIONED | 官方源码未支持此推导 | 官方catch会设version=0，文本send/register选FeatureAbility；基线direct path是项目兼容策略，实际适用仍未知 |
| native subscribe success 无参数/null可表示注册成功 | 有官方源码证据支持 | S6明确映射；不是“缺少注册回调”或普通消息 |
| subscribe success 有isRegister真表示注册事件；文本/文件表示消息 | 有官方源码证据支持 | 注册不是应用级HELLO/READY、更不证明手机接收器已就绪 |
| subscribe fail 接收第一/第二参数 | 官方原样转发支持 | wrapper不像send那样合成206；基线REG helper仍会丢第一参数 |
| `device.p2p_capability=0` 能解释该次 native SEND_0 | 未知 | 手机对象具体SDK字段映射未在此任务取证；0不能独立断言“不支持”或“成功” |

**官方未提及/未取得不等于不支持。** 本次唯一“否”是对 wrapper 代码确实没有的四段验证，不是对某型号底层能力的否定。

## 最小可复现 fixture、真实输出与 RED 契约

### 运行已落盘的10项观测（不会读设备/改产品）

```sh
cd /data/data/com.termux/files/home/we-handshake-repair-20261115-watch
node --test qa/we-handshake-20261115/research/sdk-contract-fixture.test.mjs
```

`node v26.4.0` 实际：`tests 10 / pass 10 / fail 0 / exit_code 0`。输出保存 `sdk-contract-green.log` 与 `.meta.json`。包含：

- native fail第一参数为文本、数字、对象、undefined，第二参数0/省略/206：官方始终206且保留data；success→207。
- 实际官方 wrapper 的401/303/302总线分流与包名303门槛、指纹302门槛。
- 官方subscribe无参数/null/isRegister事件、message事件、fail双参数原样转发。
- 基线等待version与registration、close后旧回调无效、无version时UNVERSIONED分支。
- `3.401`只是未证实形状的对比输入，不建议据此立即放宽产品解析。
- 真实基线 `reply` 方法执行的 summary覆盖（没有入站HELLO）。

### 单独候选 RED：诊断保真，不假定错误对象格式

```sh
node --test qa/we-handshake-20261115/research/native-fail-minimal.red.test.mjs
```

实际：`tests 1 / pass 0 / fail 1 / exit_code 1`，符合故意 RED：

```text
AssertionError [ERR_ASSERTION]: bounded diagnostics must preserve raw first arg; actual=SEND_0
actual: '"SEND_0"'
expected: /16/
```

最小核心注入是 `sendMsg:p=>p.fail(16,0)`；断言：仍是失败，同时应能区分第一参数16而不能只剩SEND_0。具体未来错误结果格式未强制。这是**诊断保真建议契约**，不是证明native错误码为16，也不是要求将SEND_0→SEND_16。

### 可供父加入后续 RED 的契约矩阵

1. 同一失败结果保留 `stage='SEND'`、`callback='fail'` 和两参数的类型/有无；业务失败按官方206，不以第二参数0转成功。安全诊断只记录各参数的有限数字值（若为 number）及类型/有无；字符串正文、对象内容、消息正文、指纹、key 一律不记录，也不把字符串或对象自动解析成错误码。`fail(16,0)` 必须区别于 `fail(undefined,0)`，但两段不同字符串可按同一安全类型摘要处理。这样的日志不声称揭示所有底层失败原因。
2. success分支独立；`fail`无论参数空/异常形状不得触发READY_OK。仅厂商发送成功不等于手机已收到合法READY，更不等于APPLIED。
3. 注册empty/isRegister事件可以打开通道；普通message不能被误用成注册事件。注册失败应区分send失败；send失败不自动宣称已退订。
4. 按真实service尾段路由；不根据函数缺失、包版本306、手机capability0猜现代总线。无API路径是否继续仅由已支持平台策略决定，不能写“已协商”。
5. UI/日志应独立保留 `bus/queriedVersion/registrationEvent/lastSendCallback`，避免detail覆盖造成取证失真。现有“无SDK截图→没REG”的归因要排除；区分主动READY与真实HELLO回复。

本任务不实现这些产品修改。

## 官方URL与获取途径

- P2P API：https://developer.huawei.com/consumer/en/doc/connectivity-References/point-to-point-message-0000001052164296
- 同页中文正文：https://developer.huawei.com/consumer/cn/doc/connectivity-References/point-to-point-message-0000001052164296
- 返回码：https://developer.huawei.com/consumer/en/doc/connectivity-guides/errocode-0000001054450278
- FAQ：https://developer.huawei.com/consumer/cn/doc/connectivity-Guides/faq-0000001050818031
- 官方Lite SDK：https://developer.huawei.com/consumer/en/doc/connectivity-Library/litewearable-sdk-cn-0000001705004353
- JS版本历史：https://developer.huawei.com/consumer/en/doc/connectivity-Guides/version-change-history-0000001133580285
- 集成说明：https://developer.huawei.com/consumer/en/doc/connectivity-Guides/integrating-fitnesstwatch-sdk-0000001052859174

公开页面空白/抽取省略时，用仓内旧取证的API配方调用官方只读文档接口，未启动浏览器：

```text
POST https://svc-drcn.developer.huawei.com/community/servlet/consumer/cn/documentPortal/getDocumentById
Content-Type: application/json
{"objectId":"point-to-point-message-0000001052164296","language":"cn","catalogName":"connectivity-References"}
```

这是正文读取接口，不是产品写操作。六份响应均HTTP200/code0、标题/非空正文已核验；响应、HTML、提纯全文、公开链接与获取时间存 `official-acquisition.json` 及 `*.response.json/*.body.html/*.text.txt/*.links.json`，不保存认证头/cookie。元数据时间字段原样保存，不推测其时区。

## 未闭合项 / 禁止的结论

- 未取得目标固件 native `@system.wearengine` 实现，**不能确定**fail实际参数顺序的底层来源/类型、第二参数0的native含义、version函数实际availability或sdkVersion参数副作用。
- 无原始双参数记录，**不能确定**native `data`是否含真实206/16/其他错误码。
- 不能从“回执失败 SEND_0”判断真实HELLO已到、REG没回、使用UNVERSIONED或SDK401、蓝牙已好/坏、手机能力不支持。
- 官方FAQ是候选检查列表，不是这轮唯一根因证据；不重开已结案Scope，不要求清数据/重装。
- 本次证实的是wrapper契约和诊断丢失根因；尚未解决或验证真机HELLO→READY连通。

## 工作区说明

开始时HEAD83d58a8且已读源码；后续父并行编辑phone-sync、wearAwake及其测试。本研究所有执行用`git show 83d58a8:<path>`固定基线，未覆盖父改动。研究者新增/修改的文件只在本report同目录；未build、install、手机操作、commit、push或其他仓修改。

最终只读核验（`2026-11-15T00:28:06+08:00`）：wearService、wearChannel及FIT3参考wearengine均与83d58a8逐字节相同；共享树的app/phone-sync等并行改动未归因给本研究。研究目录81份文本/JSON/源码类证据做私钥块、JWT、Bearer值模式扫描，命中0；这不是穷尽式凭据审计。回执为 `research-final-audit.json`。报告按父要求停止扩展调研，真实设备原始失败仍unknown。
