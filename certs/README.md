# 签名材料（一次性配置）

**一个 p7b = 一个安装身份**：签名步 `FORCE_P7B_BUNDLE=1` 会把包内 config 的
`bundleName` 改写成证书里的 `bundle-name`，手表按**包内 config 包名**识别应用，
同名安装 = 更新（覆盖数据）。

| 文件 | 安装身份（bundle-name） | 用在 | 私钥位置 |
|---|---|---|---|
| `elcton.p7b` | `watchapp.nexus.0zzip` | 课程表 elcton | Secret `SIGN_P12_PEM_ELCTON` |
| `app.p7b` | `drt.sign.yzm.nexus.jvor1` | clan / focus | Secret `SIGN_P12_PEM` |

- **elcton 专属证书**（2026-10-09 申请）：绑 FIT3（UDID `18A007CB…20E3`），
  有效期 2026-10-08 → 2027-10-08；私钥不入库，本地在 `~/hw_watch/agc-cert/key.pem`（600）。
- **教训（2026-10-09 实测）**：三个工程曾共用 `app.p7b` → 结果装课程表把
  memo-todo 覆盖了、老课程表又没被更新。**新项目各自申请证书，禁止复用。**
- 老课程表（8 月装的）身份是 `hap.sign.20260805124057`，那张证书已过期、私钥当时用完即删，
  装不回去；要收编就手动卸载一次，改由 `elcton.p7b` 的身份接管。
- CI 检测到对应 p7b 存在即自动签名出 `.hap`；不存在则只出未签名 `.app`。
- 注意：不要把 `.p12` / `.pem` 私钥放进 `resources/`（会打进应用包）。
