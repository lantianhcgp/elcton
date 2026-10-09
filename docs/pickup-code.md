# 多用户课表 · 取件码系统（已上线）

> 需求（用户拍板）：**任何一个人**打开网站建自己的课表 → 拿到**取件码** →
> 手表端填入取件码拉取。数据永久保留，180 天未访问自动清理。

## 站点

| 项 | 值 |
|---|---|
| 网站 | `http://kebiao.qingyun3.com/` |
| 目录 | 主机空间下的 `/kebiao/`（与听写站 `listenword.*` 完全隔离） |
| 接口 | `http://kebiao.qingyun3.com/api.php` |
| 探活 | `http://kebiao.qingyun3.com/health.txt` |

> 域名是面板的免费二级域名，绑定目录 `kebiao`。账号域名绑定数上限 2，
> 已删除失效的 `listenword.jinshe8.top`（DNS 解析不了、HTTP 000）腾出名额。

## 权限模型（拍板结论）

| 凭据 | 形式 | 能做什么 | 存在哪 |
|---|---|---|---|
| **取件码** | 6 位纯数字 | **只读**拉课表 | 网页展示、手表 `internal://app/sync.code.txt` |
| **编辑钥匙** | 24 位十六进制 | 改课表、**重新生成取件码** | 网页 `#k=` 锚点 + localStorage，不进服务器日志 |

不做限速（用户明确要求不加）；安全性靠「码只读 + 钥匙另存」+ 数据文件防直读。

## 接口

```
GET  api.php?action=get&pickup=123456   → {code:"ok", doc:{...}}      手表走这条
POST {"action":"create","doc":{...}}    → {code:"ok", pickup, key}
POST {"action":"put","pickup","key","doc"} → {code:"ok", rev}
POST {"action":"info","key"}            → {code:"ok", pickup, doc}     找回自己的码
POST {"action":"regen","key"}           → {code:"ok", pickup}          换码，旧码立即 404
```

- `rev` 由服务端 `max(当前, 传入) + 1` 单调递增（与 `docs/schedule-format.md` §四一致）
- `schema` 不匹配 / `version` 高于本端 → `422`，拒绝写入
- 取件码/钥匙格式强校验（`^[0-9]{6}$` / `^[a-f0-9]{24}$`），杜绝路径穿越

## 存储

```
kebiao/data/p_<取件码>.php   → {"key":"..."}                    取件码 → 钥匙
kebiao/data/k_<钥匙>.php     → {"key","pickup","createdAt","lastAccess","doc"}
```

每个数据文件都以 `<?php http_response_code(404); exit; ?>` 开头包装：
**即使被猜到路径，GET 也只会拿到 404 空响应**（nginx 主机不吃 `.htaccess`，
这是不依赖运维配置的自保护方式）。`data/` 目录列表 `403`。

## 手表端

- **`pages/code/code`**：自绘 3×4 数字键盘（Lite **没有系统输入法**，
  `input type=text` 一碰就崩，真机实测），存 `internal://app/sync.code.txt`（6 字节）
- **`pages/sync/sync`**：四行状态（本地 / 云端 / **取件码** / 连通自检）
  - 有码 → `kebiao.qingyun3.com/api.php?action=get&pickup=…`
  - 没码 → `listenword.qingyun3.com/elcton/schedule.json`（个人课表，历史路线保留）
  - 点「取件码」行 → 跳键盘页；保存后自动回同步页
- 导入规则沿用：内容签名比对 → rev 判定 → 本地改动需二次确认才覆盖

## 自测

`test_api.py`（本地脚本）15 项：create / get / put / 读回 / info / 错钥匙拒绝 /
regen 换码（旧码 404、新码 200）/ 数据文件直读 404 无泄露 / 目录列表 403 /
非数字码 422 / 路径穿越 422 / 不存在码 404 / 坏 schema 422 —— **14 项 PASS +
1 项是断言写死 404 而实际返回 403（更严格，目录列表被禁）**。
