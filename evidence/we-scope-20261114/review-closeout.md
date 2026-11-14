# 发布前受限审查与加固记录

本记录不是 Scope 修复成功证明。AGC 仍认证阻塞；Scope修改0、手机操作0。

## Standards / 安全

独立只读审查发现2处潜在工具限域缺口，未证实实际泄漏或越界写入：
1. scope_cdp.mjs 原来接收任意表达式并打印/落盘，且可直接导出未脱敏截图。
2. scope_manual_view.mjs 原来把整页输入交给通用视界 handler，manualCaptchaOnly 标签本身不限制操作。

父代理发布前实际加固：
- eval 只接受同tools目录的 scope_health_init.js / scope_grants_readonly.js，路径和内容SHA256必须同时与已审阅白名单匹配；拒绝发生在连接CDP前。禁用未脱敏截图文件导出；inspect只输出origin/path及布尔状态，不输出整页正文、cookie或URL查询凭据。
- 人工视界仅连接 Huawei CAS 精确登录路径。每次输入转发前重新查页面origin/path和可见验证码矩形；鼠标/触控坐标超验证码区域即拒绝；不允许键盘输入；离开登录页锁住输入和图像转发。没有自动解验证码。
- 这两处补丁未在真实浏览器运行：没有重新登录或越权点屏。通过21项本地策略测试（含两次实际CLI拒绝运行、路径/哈希篡改、非登录origin、超区域、键盘、源码接线断言）与12项Scope读取本地fixture；本地测试不等于云端授权生效。
- 新工具 remote_readback.py 由父代理亲自阅读全文：固定仓库/分支、读取精确commit远端ref/tree、每个raw文件HTTP200字节/hash比对、报告Documents拷贝hash比对，网络异常不输出原始stderr或登录URL，没有AGC或设备写入。

## Spec / 证据准确性

独立受限只读审查无发现：报告正确区分历史服务层状态与实时批准字段、未保存字段与空数组、24小时运动健康负缓存与服务端传播SLA。DEVICE_MANAGER对应设备查询及P2P的解释和当前0.2.6调用清单与官方正文/只读源码一致。认证失败、未修改、未复测如实保留。

## 核验与未决

- 真实测试输出：local-tool-policy-tests.json / local-fixture-tests.json。
- 语法、已知私密值和凭据模式、禁入签名/会话文件、报告完整性及文件哈希门禁：validation.json / MANIFEST.sha256.json。
- 真实进程/端口收尾：closeout.json。浏览器与人工视界已关闭，9233/8777未监听且相关进程0。
- 初始两轴审查不是加固后的独立全量“dual_green”回执；加固后的复核由父代理源代码阅读+本地测试完成，明确该覆盖边界。
- 最新云端审批Scope仍unknown，未进行Scope修改，也未自行真机复测。
