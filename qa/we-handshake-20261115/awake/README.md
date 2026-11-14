# 用户令 B：同步页常亮 — 交付与证据

工作树：`/data/data/com.termux/files/home/we-handshake-repair-20261115-watch`
基线：`83d58a8`。本子任务无 commit、push、版本/CI/HML/CSS/旧测试修改，无浏览器、手机操作或安装。

## 已实现

- `phone-sync.onShow` 懒创建 `wearAwake`，发出 `setKeepScreenOn({keepScreenOn:true})`。
- `onHide / onBack / onLegacy / onDestroy` 先解除本页请求（false），再照原样停止监听；返回/旧同步路由之前完成发起 false。
- `stop()` 和取消接收不解除常亮：仍在同步页就保持请求，直到离页。
- 销毁后 onShow 不会复活。重复 show/hide/destroy 不重复申请/释放。
- guarded `require('@system.brightness')`：无 require、缺模块、缺方法、同步 throw、异步 fail 均不抛入同步流程。旧 loader/旧夹具不新增 brightness 依赖。
- generation + 单次终结回调守卫；隐藏后的晚到 true 成功补 false，重新进入后的旧 false 成功补当前 true，旧日志/失败与重复回调不污染新代际。
- 只输出 `KEEP_ON`、`KEEP_OFF`、`FAIL` 固定 stage，不输出原生错误参数。父 logger 可捕获这些 console.info。
- helper 无 timeout、interval、轮询、亮度值/模式变更，只有小型标量状态与有界原生调用回调。

## 真实测试记录

统一命令：`node --test tests/weScreenOn.test.mjs`。只有此新测试文件被执行；全回归由父最终执行。

| 证据 | 实际结果 | 说明 |
| --- | --- | --- |
| red-01.log | 1 test，1 fail，exit 1 | 原页 onShow 缺失，AssertionError；非导入/语法错误 |
| green-01.log | 1/1 pass，exit 0 | 最小 onShow 获取 |
| red-02.log | 9 tests，7 fail，exit 1 | 退出 false/幂等缺失 |
| green-02.log | 9/9 pass，exit 0 | 生命周期释放、重入、取消监听仍保持 |
| red-03.log | 21 tests，6 fail，exit 1 | 晚到 true、旧代际日志、销毁后 onShow 复活 |
| green-03.log | 21/21 pass，exit 0 | 代际与销毁守卫 |
| red-04.log | 21 tests，1 fail，exit 1 | 重新进入后晚到旧 OFF 需补当前 ON |
| green-04.log | 21/21 pass，exit 0 | 晚到原生完成恢复当前可见状态 |
| green-final.log | 27/27 pass，exit 0 | 补充既有异步失败/重复终结/旧 loader 行为覆盖，不新增生产逻辑 |

每次运行均原样保存 stdout+stderr 合流字节；对应 `.meta.json` 保存完整命令、cwd、退出码和真实时间。所有初始失败日志保留未覆写。

## 范围、diff 与自审

本子任务实际写入的产品/测试仅：
- `entry/src/main/js/MainAbility/pages/phone-sync/phone-sync.js`
- 新 `entry/src/main/js/MainAbility/common/wearAwake.js`
- 新 `tests/weScreenOn.test.mjs`
- 以及本 `qa/we-handshake-20261115/awake/` 证据。

`baseline-tracked-sha256.json` 固定本任务开始时 978 个追踪文件摘要。`scope-verification.json` 保留首次范围检查失败：期间外部并行修改了 `app.js`（log 配置、L.init/L.page/L.stop）。本子任务从未写入或回滚 app.js。`scope-own-final.json` 将外部变更单独列出，不伪称全工作树仅本任务改动；父应协调该 logger 修改。

原页 `watchDog` 到 `onBack` 前整段（包括 onListen、reply、stop、cancel/commit）与基线逐字节一致。除同步页和外部 app.js，另 976 个原追踪文件摘要不变。`node --check` 三个产品/测试文件与 `git diff --check` 均 exit 0。

保存：`phone-sync.diff`、`wearAwake.js.diff`、`weScreenOn.test.mjs.diff`。未生成独立审查者/真机通过回执；以上为开发者自审与实际 Node 结果。

## 官方边界与待父验收

`sdk-brightness-evidence.txt` 保存本地官方 SDK 路径、SHA256 和原文行号 279-320 / 381-403：since 3、reserved liteWearable，规定 onShow 调用。**该 API 仅避免无操作自动超时；盖屏/用户动作和系统常亮期限结束仍可能灭屏，不保证永久亮。**

SDK 无 getKeepScreenOn。退出 false 只是解除本页请求，不读取/改变系统亮度/模式，也不能承诺还原其他模块或用户未知的常亮状态；原生释放失败只固定 FAIL，不能声称实际屏幕已恢复。

本任务仅验证 Node 生命周期、异常隔离与原生异步控制，不验证真实功耗、盖屏、系统常亮期限、目标型号/固件、JerryScript 堆上限或 SDK 构建后 require 转换。没有构建/模拟器/真机测试；这些以及全回归交父执行。
