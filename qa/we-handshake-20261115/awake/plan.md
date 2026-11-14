# 同步页常亮 Implementation Plan

**Goal:** 仅 phone-sync 可见期间申请系统 keepScreenOn，离页解除本页请求。
**Architecture:** 新增小型 ES5 wearAwake 工厂，guarded require('@system.brightness')，页面 onShow 获取；onHide/onBack/onLegacy/onDestroy 释放。stop/onListen 不接入常亮，监听取消后仍该页继续保持请求。
**Tech Stack:** HarmonyOS JS Lite Wearable；官方 @system.brightness.setKeepScreenOn；Node node:test。

用户已授权本范围自主实现；不再扩展设计、不 commit/push。仅允许页面、新 helper、新 tests/weScreenOn.test.mjs 和本证据目录写入。

1. 读取真实页面、旧 loader 和 SDK；记录 baseline83d58a8 与原文件摘要。
2. 公共测试 seam：页面生命周期 + 系统 brightness 实际调用，真实页面/WE 依赖，仅系统 API 和计时器注入。首先写 onShow 测试，运行真实 RED（缺少 onShow 行为）保存完整输出与退出码。
3. 最少实现 onShow 获取；GREEN 后逐个补退出、幂等、late callback、新代际、不复活、缺模块/抛错/异步 fail、监听取消仍保持亮测试。每次需要新生产行为均先观察 RED。
4. 仅运行新测试文件（不运行全回归，由父执行）；验证旧 loader 无 brightness 能加载，watchDog/cancel/commit 原逻辑与其他追踪文件不变。
5. 记录命令、完整 RED/GREEN 日志、diff、scope/hash 验证及平台边界。

复跑：node --test tests/weScreenOn.test.mjs

SDK：/data/data/com.termux/files/home/devpkg/simx2/DevEco-Studio/DevEco-Studio.app/Contents/sdk/default/openharmony/js/api/@system.brightness.d.ts
- 279-320：keepScreenOn true/false、成功/失败回调。
- 381-403：onShow 调用，since3，reserved liteWearable。仅阻止无操作超时，盖屏和系统常亮期限结束不保证保持亮。
- 无 getKeepScreenOn；释放只能发送 false，不读取/改变系统亮度或模式，不承诺还原其他模块/用户的未知常亮状态。

不调用浏览器、手机、安装、CI。目标真机型号/固件/SDK 构建后的 require 转换与真机常亮功耗本任务不验收；Node 仅证明生命周期与异步控制。
