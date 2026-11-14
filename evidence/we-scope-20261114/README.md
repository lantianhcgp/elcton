# Wear Engine Scope8 调查证据

目标：Android hc课程表 / 118599721 / com.hcbiu.elcton。
本轮结果：未修复；认证阻塞，Scope修改0；没有改变App代码、签名材料或手机状态。

请先读 Scope修复报告.md。它区分真实日志、历史服务状态、公开官方权限定义、当前认证失败和仍待核的审批字段，附精确人工操作单。

目录：
- historical/：2026-11-13原01/04及白名单服务读回，不能冒充当前状态。
- realdevice/：发起方原logcat的四行节选和完整源日志哈希。未重新操作手机。
- frontend/：华为公开申请/详情源码；source-verification.json记录本次HTTP200重下载逐字节比较和六个Scope。
- official/：五份华为公开正文JSON及文本；原正文不是合成返回。
- session-*.json、login-*.json、grants-blocked.json：本次真实认证失败记录。密码/Cookie/私钥未入仓。
- closeout.json：浏览器和视界已关闭，9233/8777未监听且无Chromium/视界进程残留。
- local-fixture-tests.json：仅本地读取脚本的fail-closed测试，不代表云端Scope批准。
- MANIFEST.sha256.json、validation.json：文件完整性/语法/已知私密值与凭据模式扫描。
- review-closeout.md、local-tool-policy-tests.json：审查发现与发布前加固；精确表达式哈希白名单、截图导出禁用、人工输入仅限登录验证码区域。本地测试不是实时授权证据。
- .gitattributes：历史原件与官方提取文本保留原有空白，不为格式门禁改写证据；仅这些源快照免空白告警，新工具/报告仍走git diff --check。
- tools/：任务限域工具；安全自愈依赖既有私有登录库，凭据仅运行时读取，不复制或输出。验证码始终人工。

复验（不启动浏览器，不操作AGC或手机）：

    node evidence/we-scope-20261114/tools/test_scope_grants.mjs
    python evidence/we-scope-20261114/tools/validate_scope_evidence.py

验证结果仅覆盖证据与本地逻辑，不能称“根因已修复”。远端读回记录落在原交付目录Scope修复远端读回.json，提交中的报告/完整证据树要与远端实际字节对应。分支基点是origin/master 851537a9fade0e941f7a20f4078a04c90f2d2343；仅新增本目录，不合并主分支。
