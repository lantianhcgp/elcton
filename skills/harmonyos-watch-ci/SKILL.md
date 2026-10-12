---
name: harmonyos-watch-ci
description: 鸿蒙 Lite 手表 App 的 CI 构建签名交付链。触发：elcton、focus、手表 hap。
version: 1.0
author: lantianhcgp + hermes-agent
license: MIT
metadata:
  hermes:
    tags: [harmonyos, watch, ci, hap, signing]
    related_skills: [huawei-lite-watch-development]
---

# HarmonyOS Lite Watch CI —— B 方案全链路（已实测装表成功）

仓库 `lantianhcgp/elcton`（private，monorepo）：`elcton/` 课程表在仓库根（path="."）、
`focus/` 专注计时在子目录（2026-10-03 入仓）。`clan/` 日历子工程已删除
（2026-10-12，用户判定简陋废弃：目录/CI 矩阵/README/legacy-clan 证书一并移除）。
2026-10-03 首次全链路贯通并真机安装成功。

## When to Use

改这两个工程、要出 .hap、排查 CI/签名/装表报错、或要复刻本链路到新仓库时加载。

## 链路（.github/workflows/build.yml，push 触发，matrix 双工程：elcton/focus；clan 2026-10-12 已删）

```
setup-ohos@v2 (CLT 6.1.1.280, cache) → ohpm install --all
→ hvigorw assembleApp --mode project -p product=default -p buildMode=debug --no-daemon --accept-license
→ scripts/clean_config_in_app.py（5 类清洗）
→ tools/sign/sign-app-to-hap.js（FORCE_P7B_BUNDLE=1, certs/app.p7b）
→ artifact <project>-<N>/：未签名 .app + 签名 .hap
```

## 关键决策（勿随手改）

1. **CLT 版本 = 工程 modelVersion**（6.1.1.280）。勿升 26.x——faMode/LiteWearable 老工程形态。
2. **matrix 用 path 变量**：elcton 在仓库根 → `path: "."`；直接写项目名会因目录不存在失败。
3. **FORCE_P7B_BUNDLE=1 必开**：签名时 config 包名 ← 证书包名，满足错误码 28 的
   「签名包名与 config 一致」；证书身份唯一 → 装表 = 新应用，不覆盖现役应用数据。
4. **证书**：`certs/app.p7b` = `drt.sign.yzm.nexus.jvor1`（2026-09-27 签发，**有效至 2027-09-27**），
   CSR 备份 `certs/default.csr`。换证书 = 替文件 + push。旧日历证书
   `hap.sign.20260805124057` 已过期且 = 现役课程表身份，**禁用**（同名覆盖数据）。
5. **签名材料只放 `certs/`**，绝不进 `resources/`（会打进应用包）。

## 新增工程入矩阵（focus/ 专注计时，2026-10-03 实测）

1. 照 `focus/` 结构建子目录工程：build-profile / oh-package×2 / hvigorfile×2 / code-linter /
   .gitignore / hvigor-config 成套复制后改名，`reference/`、csr/p12 不带；matrix 加
   `- project: <名>` + `path: <目录>`；i18n 目录保留（已装包带 i18n，82 未复发）。
2. **源码 `app.bundleName` 用真实包名（com.hcbiu.<app>），别用 com.example.\***：hvigor 把它
   注入 module.package，clean 脚本只把 `com.example*` 改写回 app.bundleName（源码也是
   com.example.* 时是空操作），而 FORCE 改包名发生在 clean **之后**——源码用 com.example.*
   会把 `module.package=com.example.*` 烘进签名包，偏离「已装成功包 module.package=真实包名」
   形态（40 未实测，但改真实包名零成本）。focus 首版 com.example.focus 构建全绿后返工重推才对齐。
3. 中文文案放置见 `huawei-lite-watch-development` 资源节（HML 走 $t/实体、JS 走 \uXXXX）。

## FIT3 已验证 config profile（从装成功的包逆向，改动前先对齐）

> 换目标机型先查**机型规格矩阵**（`references/watch-model-matrix.md` + 原图，双仓 references/；
> skill 侧 `huawei-lite-watch-development/references/device-compatibility.md`）：
> compatible/target 上限按机型档位选（GT3=API7?、GT2=API3、FIT2/D=API7 都装不上 4.0.0(10)），布局用适配分辨率。

```
app.apiVersion.compatible = 40000010   # 4.0.0(10) —— 表支持的老 API，新值会 40
app.apiVersion.target     = 60101024   # 6.1.1(24)
app.version.code          = 0
deviceConfig              = {}         # debug 构建会注入 default.debug=true，必须洗掉
module.package            = 真实包名
```
外加：icon.png ≤48x48、icon_small ≤32x32、label ≤22 字符、无 module 级 reqPermissions、
UTF-8 无 BOM。build-profile 需显式字符串 `"compileSdkVersion": "6.1.1(24)"`。

## 清洗脚本（scripts/clean_config_in_app.py，就地改 .app）

剥离 hvigor 注入的 `app.appEnvironments` / `apiVersion.compileSdkVersion|compileSdkType`、
`deviceConfig.default.debug`（收敛 default）、`module.package` com.example* 默认值、BOM。
用法 `python3 scripts/clean_config_in_app.py <glob>.app`；改 schema 相关问题先跑它。

## 交付环（与 lite-widget 同款节奏）

1. `bash ~/.hermes/scripts/ci-wait.sh <仓库目录>` 后台轮询（notify_on_complete，禁长 sleep）
2. 取 artifact：`curl -L -H "Authorization: token $TOKEN"`（token 在 `~/.git-credentials`，
   ghp_ 开头；**urllib 跟 302 到 Azure 会 401/403**）；字段 `size_in_bytes` 不是 `size`。
   ⚠️ **显示打码陷阱**：凭证文件/脚本内容被查看时授权头显示为 `token ***`——把显示的 `***`
   原样抄进 curl 必 401；授权头一律用 `$(grep …)` 变量或 python 读凭证文件现场构造，
   绝不复制显示出来的鉴权文本（2026-10-03 实例）
3. 校验：直接跑本 skill 的 `scripts/verify_hap.py <artifact目录>`（约 26 项断言，装前把关）；
   手工等价项 = signed.bin 头（`0xBE` + int32 + bundleName）== 内嵌 config 的 bundleName、
   profile 断言（compatible/deviceConfig/versionCode 对照上表）。
   ⚠️ signed.bin 内嵌字节还含 p7b profile，自带 `"type":"debug"`/`"debug-info"` 字样——
   断言 deviceConfig 无 debug 必须解析内嵌 config JSON 段（从 `{"app"` 起括号配平），
   整包 grep 会误报（verify 脚本首版踩过）
4. `cp → /storage/emulated/0/Documents/ → ls -la 验证 → MEDIA: 发用户`（铁律）

## 错误处理

按报错码查 `huawei-lite-watch-development` 的 `references/install-error-codes.md`
（23/27/28/30/40/47/82 全表 + 注解）；40 用**「失败包 vs 已装成功包 config 全字段 diff」**
方法定位（本次靠它抓出 deviceConfig.debug 和 compatible 两颗暗雷——Codex 8 月攻防
只修过前三个，clan 的 40 当时从未修通）。

## 本环境特有（Termux）

- `/tmp` 只读 → 临时文件放 `~/lw_build/`
- 签名依赖 npm（jsrsasign/jszip）在 runner 装，本机不装
- 真机安装 = 用户手机（华为穿戴 app）→ 手表，无 hdc 直连
