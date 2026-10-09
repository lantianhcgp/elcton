# 开源发布脱敏清单（私有 → 公开）

当前仓库为 private，内含个人签名材料与身份标识。**直接把现仓库转 public 不行**——
git 历史里也有敏感文件。按本清单处理后再开源。

## ⚠ 历史已提交的敏感文件（必须处理）

git 历史中曾新增（`git log --diff-filter=A` 可查）：

- `certs/legacy-clan/debug.p12`（**私钥**）、`debug.cer`、`debug.p7b` — commit `819052e`
- `certs/app.p7b`、`clan/debugKeyStore.p12`（**私钥**）— commit `9386d88` 等

**两条路（推荐 A）：**

- **A. 干净导出（推荐）**：新开仓库，从当前工作树导出（不含 `.git` 历史）再 `git init`。
  历史零泄漏，一步到位。
- B. 历史重写：`git filter-repo --invert-paths --path certs/ --path clan/debugKeyStore.p12 ...`
  需要重装 remote、强推，麻烦且易漏。

## 文件级清单

| 项 | 位置 | 处理 |
|---|---|---|
| 调试证书 p7b | `certs/app.p7b` | 删除；`.gitignore` 加 `*.p7b`；fork 者自备（certs/README 已写流程） |
| CSR | `certs/default.csr`、`clan/*.csr` | 删除（可再生） |
| **私钥 p12** | `certs/legacy-clan/debug.p12`、`clan/debugKeyStore.p12` | **必须删除**；`.gitignore` 加 `*.p12` |
| 旧证书 | `certs/legacy-clan/debug.cer/debug.p7b` | 删除 |
| AGC appid `118599721` | `README.md`（公开版已移除）、`skills/.../build-install-error-catalog.md` | 搜索替换删除 |
| 个人包名 `com.hcbiu.elcton` | `entry/src/main/config.json`、`certs/README.md`、skill 实录 | 改 `com.example.elcton`（签名时 FORCE 会用证书包名覆写，**功能无损**） |
| 证书身份串 `drt.sign.*` / `hap.sign.2026*` | `skills/*/SKILL.md`、`references/install-error-codes.md` | 泛化为 `<你的证书包名>`；保留 `hap.sign.20260805124057` 作为反面案例说明亦可（它只暴露证书名，风险低——自行取舍） |
| 课程数据 | `entry/.../rawfile/seed-schedule.json` | ✅ 已是 demo 数据（c_d*，随包种子），无需处理 |
| CI secrets | `.github/workflows/build.yml` | ✅ 仅用默认 `GITHUB_TOKEN`，无自定义密钥 |
| Termux/本机路径 | `skills/harmonyos-watch-ci`（如 `~/lw_build`、`/storage/emulated/0`） | 可保留（无隐私），介意则泛化为 `<工作目录>` |

## 发布前终检（grep 全绿再转 public）

```bash
grep -rn --exclude-dir=.git -E "118599721|com\.hcbiu|drt\.sign|ylogin|@1[3-9][0-9]{9}" .
find . -name "*.p12" -o -name "*.p7b" -o -name "*.cer" | grep -v README
# 两条都应无输出（示例性占位符除外）
```

## 其他建议

- License：建议 MIT（与引入的 hap-sign-utils / skill 一致），发布时补 `LICENSE`
- 致谢区保留三位上游作者（README 已写）
- 截图：手表实拍 1-2 张更友好（注意表盘壁纸/通知不带个人内容）
- fork 者签名成本 = 一次 AGC 操作，certs/README 已写明
