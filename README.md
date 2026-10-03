# elcton — 华为 FIT3 课程表（Lite Wearable）

HarmonyOS Lite Wearable（faMode / HML+CSS+JS / JerryScript）课程表应用。
目标设备：华为 WATCH FIT3 方屏，物理 408x480，适配 336x396，512KB JS heap，API 24。

## 构建（GitHub Actions，push 触发）

流程见 `.github/workflows/build.yml`：

1. `ErBWs/setup-ohos@v2` 装 **CLT 6.1.1.280**（与工程 modelVersion 匹配，勿随手升 26.x）
2. `ohpm install --all`
3. `hvigorw assembleApp ... --no-daemon` → `build/outputs/default/*-unsigned.app`
4. `scripts/clean_config_in_app.py` 清洗打包注入的 schema 非法字段（见下）
5. 签名（可选）：`certs/app.p7b` 存在时用 `tools/sign/sign-app-to-hap.js` 出签名 `.hap`
6. 产物上传 artifact（`elcton-<run>`）

### 为什么要有清洗步骤

hvigor 打包时可能往 `config.json` 注入 `app.appEnvironments`、
`app.apiVersion.compileSdkVersion/compileSdkType`，安装时按
`configSchema_lite.json` 校验直接报「40.配置文件格式错误」。
Windows 开发机当时是 patch 了 DevEco 的 hvigor 插件才干净的；
CI 的全新 CLT 没有该补丁，所以改为构建后统一清洗（顺带修
`module.package` 默认值与 UTF-8 BOM）。
完整踩坑目录：skill `huawei-lite-watch-development` →
`references/build-install-error-catalog.md`。

## 签名（B 方案：CI 内全自动）

一次性：用 hap-sign-utils 网站的 `default.csr` → AGC 创建/复用应用
（bundleName `com.hcbiu.elcton`，appid 118599721）→ 下载 `p7b` 放到
`certs/app.p7b` 提交。之后每次 push 自动出**可安装的签名 .hap**。

p7b 就位前，CI 只交付未签名 `.app`。

## 约定

- 签名材料只放 `certs/`（不进 `resources/`，避免打进应用包）
- Lite CSS 不支持 `flex-grow` / `position: fixed` / `font-weight`
- label ≤22 字符；icon 48x48、icon_small 32x32
- FA Lite 不接受 module 级 `reqPermissions`（不要加）
