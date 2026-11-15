# 第二轮解析阻塞局部实施计划

> For Hermes: 只执行本轮SDK解析与交付链，subagent-driven-development逐任务、新增改动SPEC后QUALITY，不重做已绿产品审查。

Goal: 在相同SDK和原门限下让真实接收页解析成功，再验证配置后的真实APP logger并同身份签包。
Architecture: 先冻结失败actual APP与原生rc10；逐模块原件diff判断增加的是解析压力还是API字段。只做受影响模块的语义等价压缩/归属调整，绝不删常亮或诊断功能。配置/HOST/HTTPS严格分开，绝不外推FIT3/WE握手。
Tech: CLT6.1.1.280、Jerry exact SHA7cb8af6c…、ES5、Terser既有有限alpha-renaming、Python payload gates。

## 已有授权和边界
用户2026-11-15第二轮明确授权最小白名单等价修复+RED/GREEN、CI全绿后logger实际包验证与签名交付。HEAD70092ba是仅failure-only取证追加；产品a197eec/355与既有SPEC/QUALITY保留原件。手机仓只读、表盘/留白不碰、/haps旧elcton只mv。两排除误判不回炉。

## 原始取证
CI43653381875复制46653B接收页SHA d5aa9f636feca64c471bd4c69668a3c52a51dfc9020e0c25c635235017251130，exactSDK返回10双空；其余六JS0。官方Jerry port enum10=OOM。旧1.1.15页40979B SHA787a251ee68bb104df111415fca13b60f83d4643ae719323676a5e2fd091ddf3。
本地b6ce31b0… Jerry实heap49144，旧0/新1 Script Error:null、new peak48480；effective512另一binary新旧0。这些只是同源控制，不代替exact门，也不是FIT3堆测。

## 任务1 — 模块级diff与原样控制（只读，3min）
原件: evidence/sdk-parse-r2/{old-1.1.15,new-70092ba}-phone-sync.js.source.txt。
用真实AST匹配webpack module bodies，记录每模块old/new size/hash。只在独立QA控制副本上替换单个新增模块为stub，记录原页字节不变与解析结果。绝不把控制包签名或交付。
判据：具体增量与真实小heap解析结果对上，且官方SDK页面/brightness契约无非法新增页配置的证据，才进入等价减负。

## 任务2 — 最小减负RED→GREEN（5min）
文件范围由任务1证据决定。先新增解析压力/公开接口/不变非目标资源的测试，固定旧真实失败页做RED控制。保留原355文件字节，绝不改原assertion/门限。实现只动必要源码/既有单页packaging helper；对照实际新包exact原SDK，FAIL就停而非扩大heap。新增SPEC后QUALITY绑定精确哈希。

## 任务3 — 配置后QA工具局部修复（5min）
qa/.../compiled-logger-https.mjs + README，SPEC-r2原件false五问题保留。RED测试必须覆盖敏感assert失败脱敏、success后latefail幂等、response abort/error、destroy抛异常仍报告清理、真实post-destroy未清前资源检查、placeholder public-build=expect configured。只改QA无产品漂移。新SPEC→QUALITY后运行实际新APP，不用源码冒充。

## 任务4 — CI→真实APP→网络→签名→交付
CI原tests、byte/native/sign门完整成功；actual artifact读取新sourceSHA，public与privateconfigured app.js资源差分；配置变化仅允许app.js和map，重新exact解析。
HOST调用实际编译app/onCreate/阶段SDK VER PKG CERT REG HELLO READY SEND/awake，记录真实logger status及onDestroy关闭。HOST不等于蓝牙。
真实HTTPS由该编译logger主动产生请求；云认证pull逐cursor和独立collector、canonical raw三方相同。write_key/read_key不输出/不上git；无watch-origin就保留unknown。
同certs/elcton.p7b+显式~/hw_watch/agc-cert/key.pem签、cerRoot Root+中间链、完整strong与payload/negative/版本1000119/1.1.16。用户自行安装、不操控表。
新合格HAP只写/haps最新版，旧elcton先mv旧包归档/，不动别的HAP或表盘子目录；SHA工具计算。最后精确GitHub读回、更新唯一Documents进度，保留明早点测步骤与WE unknown边界。
