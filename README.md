# elcton — HarmonyOS Lite Wearable 课程表 & 日历

华为轻智能手表（FIT3 方屏 408x480，Lite Wearable / faMode）上的课程表与日历应用，
以及一条**全自动的 GitHub Actions 构建 + 签名流水线**——push 代码，直接拿到可安装的 `.hap`。

> 本仓库包含两个应用：
> - **elcton**（仓库根）：课程表——今日/周视图、课程 CRUD、当前课高亮、单双周、振动提醒、持久化
> - **clan/**（子目录）：日历——月视图/日视图（开发中）

技术栈：HML + CSS + JavaScript（JerryScript Lite ES6 子集），纯 FA 工程，零第三方依赖。

## 仓库结构

```
├── entry/                     # elcton 主工程（课程表）
├── clan/                      # 日历工程（独立 DevEco 工程）
├── scripts/
│   └── clean_config_in_app.py # 构建后 config.json Lite schema 清洗（5 类修复）
├── tools/sign/                # 纯 JS HAP 签名器（源自 kqakqakqa/hap-sign-utils, MIT）
├── certs/                     # 签名材料（不入库，见 certs/README.md）
├── skills/                    # 开发与 CI 技能包（可直接被 AI agent 加载复用）
│   ├── harmonyos-watch-ci/            # 本流水线全攻略
│   └── huawei-lite-watch-development/ # Lite Wearable 开发规范 + 错误码总表 + 实战实录
└── .github/workflows/build.yml # 双工程矩阵 CI
```

## 快速开始（fork 后出你自己的 .hap）

1. **准备签名材料**（一次性）：用任意 CSR（可从 hap-sign-utils 网站下载）在
   [AGC](https://developer.huawei.com/consumer/cn/service/josp/agc/index.html)
   创建调试证书并下载 `.p7b` → 放到 `certs/app.p7b`
2. `git push` 触发 CI，产物在 artifact `elcton-<run>` / `clan-<run>`：
   - `<name>-default-unsigned.app` —— 未签名包
   - `<name>.hap` —— **签名完成、可直接安装**
3. 通过华为穿戴 App 安装到手表

> 证书会作为应用身份写入包内（`FORCE_P7B_BUNDLE=1`），装表 = 全新应用。
> 不同应用想并存，各自准备一份 p7b 即可。

## 流水线关键决策（改前请读 skills/harmonyos-watch-ci）

| 决策 | 原因 |
|---|---|
| CLT 固定 **6.1.1.280**（= 工程 modelVersion） | faMode/LiteWearable 老工程形态，新 CLT 可能不兼容 |
| 构建后**强制清洗** config.json | hvigor 注入 schema 非法字段 → 装表报错码 40 |
| `compatible = 4.0.0(10)`（老 API） | 真机支持的 API 档位；写新了报 40 |
| `deviceConfig = {}` | debug 构建注入的 `default.debug=true` 必须剥离 |
| 签名时 config 包名 ← 证书包名 | 错误码 28 要求签名与 config 包名一致 |

## 排查装表报错

报错码 → 解法速查表：[`skills/huawei-lite-watch-development/references/install-error-codes.md`](skills/huawei-lite-watch-development/references/install-error-codes.md)
（23/27/28/30/40/47/82 等 + 实战注解）

40 类问题的黄金排查法：**失败包 vs 已装成功包做 config.json 全字段 diff**，
差异即病灶。完整踩坑实录见同目录 `build-install-error-catalog.md`。

## skills/（AI agent 可直接加载）

- `harmonyos-watch-ci` —— 构建/签名/交付全链路 + 关键决策 + 环境坑
- `huawei-lite-watch-development` —— Lite Wearable 开发规范
  （[AlanLinYu/huawei-lite-watch-development](https://github.com/AlanLinYu/huawei-lite-watch-development)，MIT，
  含本项目追加的错误码总表与实战实录）

## 参考源码库（references/source-apps/）

社区收集的成品表应用源码，供 AI 开发时对照实现。命名 `<应用>-<系列>`，
括号内 **GT/FIT 为华为不同手表系列**（同属华为体系，屏幕与 API 档位有差异）。
详见 [`references/README.md`](references/README.md)（含版权说明与 AI 使用指引）。


## 致谢

- 签名方案：[kqakqakqa/hap-sign-utils](https://github.com/kqakqakqa/hap-sign-utils)
- 开发规范 skill：[AlanLinYu/huawei-lite-watch-development](https://github.com/AlanLinYu/huawei-lite-watch-development)
- CI 工具链 Action：[ErBWs/setup-ohos](https://github.com/ErBWs/setup-ohos)
