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

## 权限模型（v2 拍板结论，2026-10-09 第二版）

| 凭据 | 形式 | 能做什么 | 存在哪 |
|---|---|---|---|
| **取件码** | 6 位纯数字 | **只读**拉课表 | 网页展示、手表 `internal://app/sync.code.txt` |
| **设备标识 did** | 32 位 hex | **自动识别本人**：进站免密直接进编辑 | 网页 `localStorage['elcton.did']`，服务器只存索引 `d_<did>` |
| **编辑密码 pass** | 6 位数字+字母（31 字符表，去掉 0/1/O/I/l） | 换设备/换浏览器时解锁；解锁后该设备自动登记 | 服务器 `w_<pass>` 索引，网页展示可复制 |

> v1 让用户存 24 位编辑链接——用户否掉了：「不要非得让用户保存那个编辑链接，
> 你只要记录用户标识，下次进站识别一下是不是同一个人就行了，换设备再用编辑密码」。

不做限速（用户明确要求不加）；安全性靠「码只读 + 设备标识 128bit + 密码 31^6」+ 数据文件防直读。

## 接口

```
GET  api.php?action=get&pickup=123456              → doc 字段**摊平在顶层**（手表读 remote.schema）
GET  api.php?action=get&pickup=123456&page=0       → **切片**（20课/页）：{slice:true,page,pages,total,rev,updatedAt,settings,courses[≤20]}
POST {"action":"create","did","doc"}               → {code, pickup, pass}
POST {"action":"mine","did"}                       → {code, pickup, pass, doc}   本人免密进
POST {"action":"unlock","pass","did"}              → {code, pickup, pass, doc}   换设备解锁
POST {"action":"put","did","doc"}                  → {code, rev}
POST {"action":"info","did"}                       → {code, pickup, pass, doc}
POST {"action":"regen","did","what":"pickup"|"pass"} → {code, value}             换码/换密码
```

> **真机踩坑**：v1 的 `get` 把课表包在 `{"code","doc":{...}}` 里，手表读顶层 `remote.schema`
> 拿到空 → 「schema 不匹配，schema=」。改成摊平到顶层后，**不重打包就好**；
> 手表端仍保留拆包兼容（`sync.js`）以防以后再包一层。

> **真机踩坑（2026-10-10 卡死事故）**：60 课整份 ≈11KB 一次 fetch 打给 Lite 手表 →
> 点「拉取」直接卡死。修复 = `&page=N` 切片（10课/页 ≈2KB）+ 手表端串行逐页拉
> （页间 400ms 放行、页间 rev/updatedAt 一致性校验、响应无 `slice` 字段自动走整份老流程）。
> 协议向后兼容：不带 `page` 参数的响应形状未变，网页端/旧手表不受影响。
>
> **第二轮事故（切片后仍卡在 4/6）**：根因不是单次大小而是三叠加——
> ① fetch 回调链外层 try **吞掉处理异常**（链断+看门狗已清+无报错=无声冻结）；
> ② 60 课**对象树渐进累积**在 64/256KB JerryScript 堆上到 40 课逼近 OOM（两版都卡 40 课）；
> ③ 页间 setTimeout 期间**看门狗盲区**。修复全在手表端 sync.js（commit e1f60dd）：
> cb 异常显式报错、全程滑动看门狗、文本累积+逐段 parse+签名长度短路、状态行诊断标记环。
> 详见 skill `huawei-lite-watch-development`「网络拉取与大响应卡死」节。

- `rev` 由服务端 `max(当前, 传入) + 1` 单调递增（与 `docs/schedule-format.md` §四一致）
- `schema` 不匹配 / `version` 高于本端 → `422`，拒绝写入
- 取件码/钥匙格式强校验（`^[0-9]{6}$` / `^[a-f0-9]{24}$`），杜绝路径穿越

## 存储

```
kebiao/data/p_<取件码>.php   → {"id":"..."}     取件码 → 本体
kebiao/data/d_<设备标识>.php → {"id":"..."}     设备 → 本体（免密识别依据）
kebiao/data/w_<编辑密码>.php → {"id":"..."}     密码 → 本体
kebiao/data/r_<内部id>.php   → {id,pickup,pass,dids[],createdAt,lastAccess,doc}
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
