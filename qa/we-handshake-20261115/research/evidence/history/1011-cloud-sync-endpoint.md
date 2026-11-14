# 云端中转端点（课表同步 · 已上线）

> 路线判定见 `lan-sync-probe.md`：手表 → 手机内网**不通**（路线 A 已证伪），
> 手表 → 公网 HTTPS **通**（签到服四轮全 200）。同步走云端中转（路线 B）。
> 端点用用户自己的香港虚拟主机，国内直连、零部署、不依赖 GitHub/CDN。

## 地址

| 用途 | URL |
|---|---|
| 课表数据（手表拉这个） | `http://listenword.qingyun3.com/elcton/schedule.json` |
| 保存接口（网页写这个） | `http://listenword.qingyun3.com/elcton/save.php` |
| 探活（几字节） | `http://listenword.qingyun3.com/elcton/health.txt` |
| 编辑页（手机浏览器打开） | `http://listenword.qingyun3.com/elcton/` |

> 同一主机另有 `listenword.jinshe8.top`，实测已不可达（HTTP 000），不要用。

## 文件职责

| 文件 | 谁写 | 说明 |
|---|---|---|
| `index.html` | 人（手机浏览器） | 单页编辑器，中文/暗色/无外部依赖，改完点「保存」 |
| `save.php` | 网页 POST | 写保护口令 + schema 校验 + `rev = max(当前,传入)+1` + 原子写 + 自动留档 `schedule.prev.json` |
| `schedule.json` | save.php | **唯一数据源**，格式与 `docs/schedule-format.md` 完全一致 |
| `schedule.prev.json` | save.php | 上一份好数据（规范 §4.6 要求可回捞） |
| `health.txt` | 人 | 几字节探活文本 |
| `ping.php` | 人 | PHP 可用性探针（`PHPOK x.y`） |

## 数据流

```
手机浏览器编辑 ──POST save.php──▶ schedule.json (rev 由服务端 +1)
                                        │
                                  手表 fetch GET
                                        ▼
                          同步页导入 → data.replaceDoc → 本地 rev 自增
```

## 导入规则（手表端 `pages/sync/sync.js`）

1. `schema` 必须是 `elcton.schedule`；`version` 高于本端 → **拒绝导入**
2. 先比**内容签名**（id/名称/星期/节次/时间/周型），相同 → 显示「已是最新」，不动本地
   - 为什么不用 rev 直接比：`store.persist()` 每次落盘 `rev+1`，导入后本地 rev 永远比云端大，
      只看 rev 会误判成「本地较新」而永远不再更新
3. 签名不同且云端 `rev` > 本地 `rev` → 直接导入
4. 签名不同且本地更新 → 提示「本地有改动」，**再点一次**才强制覆盖（不静默吃掉本地改动）
5. 导入走 `data.replaceDoc` → `store.persist`，本地 `rev` 自动 +1（规范 §四.3）

## 凭据与安全

- 面板凭据存 `~/.hermes/secrets/vhost_pk526.json`（600 权限，**不进 git、不回显**）
- `save.php` 写口令：见 `web/save.php` 顶部 `$TOKEN`（页面里同一份）——挡的是爬虫和误写，
  不是强安全边界；课表数据本身敏感度低
- 上传工具：`python3 <本地>/vhost.py put /elcton/xxx 本地文件`（面板 ajax 封装，本地工具不入库）

## 手机侧实测

- `schedule.json` 200 / 4776B / ~0.9s；`index.html` 200 / 17KB / ~2.6s
- 错口令 POST → `403 口令错误`；正常保存 → `{"code":"ok","rev":2,...}` 并生成 `schedule.prev.json`
- PHP 7.4.33 可用（`ping.php` → `PHPOK 7.4.33`）
