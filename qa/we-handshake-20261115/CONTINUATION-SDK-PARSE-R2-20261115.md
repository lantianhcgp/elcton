# 表端修复第二轮：运行预算停靠，未交付

权威旧断点保持不改：f4f230056aa31e4980a8a23ea64a147f2d6d6707 / qa/we-handshake-20261115/CONTINUATION-SDK-PARSE-20261115.md。
本文件补充第二轮实际进展；不能把局部测试/审查当作新 SDK 或握手成功。

## 当前结论

- 没有合格新 HAP，没有改 /storage/emulated/0/haps/，没有安装或操作手机/手表，没有修改手机仓、表盘或留白。
- 唯一主线仍是原 SDK 解析接收页 → CI 全绿 → 配置后真实 APP logger → 同 1.1.15 身份/签名链 → HAP。
- 四轮真实 WE 握手失败的底层原因仍 unknown；已证 SEND 失败信息丢失，不冒称握手根因修好。
- 本棒因运行预算结束。最后动态扫描修补 SPEC/QUALITY 已通过；质量回执在停靠时晚到，已核对当前六路径哈希一致。活动修补尚未提交，也未重跑新CI，不声称可交付。

## 已证解析根因与原件

CI43653381875（70092ba）保存实际失败 APP，未用于交付：
- APP SHA256 beb94482fd6b1982ed5697e1247c8db26a5623cdc08ea710af708e991719a159。
- 新 phone-sync.js 46653B / SHA256 d5aa9f636feca64c471bd4c69668a3c52a51dfc9020e0c25c635235017251130。
- 原生 SDK jerry SHA256 7cb8af6c01f4848216f429bf35d1d497734ee299e055f3f93d58a4d176cfda31：新页 rc10，stdout/stderr 双空；其他六 JS rc0。
- 旧 1.1.15 phone-sync.js 40979B / SHA256 787a251ee68bb104df111415fca13b60f83d4643ae719323676a5e2fd091ddf3，同一 SDK rc0。
- 原生 SDK 二进制已经获得，本机 QEMU 复现旧0/新10，二进制不改、--parse-only 不改、原门限不改。官方 JerryScript port enum 的10为内存耗尽；这说明接收页解析压力，不证明 FIT3 运行堆/蓝牙故障。
- 模块对照：新 wearTrace / wearAwake 与阶段调用增加解析量；HML/CSS无变化。单模块减法只作非交付诊断控制。常亮非法字段并无证据，未删除常亮或 logger。

证据：evidence/sdk-parse-r2/ 下 actual-ci-43653381875-*、exact-qemu-clean-replay-original.json、module-byte-diff.json、exact-qemu-single-module-controls.json；失败 APP 在 ~/lw_build/we-handshake-20261115/ci-failure-43653381875/。

## 已提交活动修复与 CI

工作树：/data/data/com.termux/files/home/we-handshake-repair-20261115-watch；分支 fix/we-handshake-logger-20261115。
活动代码最后已推：a9359114d495848aadb920ad03c9bf29d26ee6a5（之前产品修复提交6c5cc000f9caa73a18cdb02523727c8066bdb1a4）。

6c5cc00：完整无版本 WE 兼容工厂从 wearChannel.js 拆到 common/wearCompat.js，应用暴露惰性 _elctonWearCompat；打包后接收页只委派应用工厂。完整原 body SHA256 5cb48bd88d4a57bfd72c87a4572743af67725d8dd2c60217fc5817e6b194f529 逐字节保持。版本分流、阶段数字白名单、回执、常亮均保留。新增 SPEC/QUALITY 通过，原38测试文件与原355断言不改。

- CI43658254923 / 6c5cc00：构建前新增测试因300B公开 SDK helper 原件未上传而失败。这是父提交遗漏，原产品测试未失败；未进入原解析关。
- a935911 仅补公开 helper 原件，远端逐字节读回：pinned-babel-interop-module143.source.txt SHA e282a73c6d4a635b6aa168ad8ff37d95bc71c3b9fd70b2f56caa63cdc4094bf3。
- CI43658398691 / a935911：全源测试通过；构建 share_we_compat_app.mjs 拒 page: native initialization in compat module。实际新 SDK format-only 后 app.js20823B、接收页57776B（尚未分享/单页压缩）。SDK给模块附带惰性 requireModule 声明，被新增文本检查误拒，未到签名/原解析门。失败原件 evidence/ci-43658398691-failed.log。

因此当前没有「新包原解析已绿」的证据。

## 未提交活动改动：下一棒起点

1. scripts/share_we_compat_app.mjs 当前 SHA256 c3974c33ef912ff725e789a050fb74e50c70c885914ec418a2619837500a11da。
   - nativeScanText 只在精确 SDK FunctionDeclaration requireModule(moduleName){return requireNative(moduleName.slice(1))} 且整个模块没有其他 requireModule 标识引用时，扫描时排除声明；真实 APP 字节不删除声明。
   - 真正原生调用、篡改/引用/别名/嵌套/重复声明仍拒。
   - QUALITY R1发现 eval 动态回收惰性函数，最小增加 Identifier/Literal eval、Function 以及 globalThis/window/self/this 的 nonLiteral computed member 拒绝；普通 data[key] / literal default 保留。
   - 最后 SPEC：qa/we-handshake-20261115/reviews/native-dynamic-spec-r2.json passed=true，六路径哈希绑定。最后 QUALITY：qa/we-handshake-20261115/reviews/native-dynamic-quality-r2.json passed=true，verdict=PASS_SCOPED_QUALITY_HOST_ONLY；停靠时晚到回执已经核对六路径当前哈希相等。双审通过仅指新增 HOST 扫描增量，绝不是新 CI、原SDK解析或安装成功。
2. .github/workflows/wearengine.yml SHA256 bae9a2f2ae2123f170c4cfee181bbbb4ef7aebb5b53677b710cef59987089dc8：仅在分享前保存真实 public APP 到 build/qa-pre-share/actual-pre-share.app + source-sha.txt，失败 artifact 新增这两路径。原 SDK/字节/签名门不变。
3. 新测试：
   - tests/weCompatSharingNativeStub.test.mjs：e8687cef0cfeccebe6a0db7452a467f0ff4411137667b5e395db9423cc63264c。
   - tests/weSdkFailureEvidence.test.mjs：025c606887e58a12d96b8a26d677c89f51154b62e400426a9d3590218f327e88。
   - tests/weCompatSharingDynamicReachability.test.mjs：fb9c335e6a87949d2c3c51954db71f23d8247bebca666d41e96b882033fa4ddf。
   - NEWtests/weCompatSharingComputedReachability.test.mjs：985eb4713e8f4daaf37ab911bb03e779fc7cd8abc85558f892856a372908e732。路径就是 NEWtests，不要猜或修改原断言。
4. 最后父局部测试：上述 computed/dynamic/stub/helper/shared/pipeline/failure 子集71/71 PASS，原门禁和38原测试文件逐字节未改。不是原生/装机证明；既有355及原 SPEC/QUALITY 不重做。

上述待审脚本/测试/工作流的原字节会存入 evidence/r2-budget-checkpoint/ 的 .source.txt 副本，便于从 GitHub 重建；副本不接入活动构建。

## Logger实际包验收准备

- qa/we-handshake-20261115/compiled-logger-https.mjs + README 与测试已修五个 QA 问题并 SPEC/QUALITY R3 PASS。运行实际编译 logger 经 Node HTTPS 主动请求；须云认证 pull、canonical raw 与独立 collector 逐行读回。只是宿主 HTTPS，不是表源。
- compiled-logger-host.mjs 当前08b48596363817ff2ddc473ba72f40d42d31b3626b2b4a394951c21640b43399；新增 selectCompiledChannel 与 CLI guard 已单独 SPEC/QUALITY PASS。主脚本只生命周期与 SEND_FAIL smoke，未使用 helper，不可声称完整 WE 阶段验通。SPEC路径 reviews/compiled-logger-host-owner-spec.json；QUALITY路径 qa/.../reviews/compiled-logger-host-owner-quality.json。
- 独立 compiled-we-stages.mjs 当前 d666084ff1e7c01b062aa6faeb1d938f584b4e7137a7efd6595e1213429f42a9：原 APP/page 字节直接 VM，计划验证 SDK/VER/PKG/CERT/REG/HELLO/READY/SEND 与常亮进入/退出；无实际新 APP 执行回执。
- 阶段脚本报告覆盖输入漏洞与失败msg发布已修；SPEC reviews/compiled-stage-spec-r2.json、QUALITY qa/.../reviews/compiled-stage-quality-r1.json PASS。原4工具测试 + NEWtests/compiledWeStages.test.mjs：9 PASS、1 hardlink EACCES skip（仅工具边界，不是包验收），原 stage调用流程仍需真实APP运行。
- NEWtests/compiledWeStages.test.mjs SHA32383c814d6dacfec69315a4e011d38e6581bfbf03ad867c08e1011092f9896d；原 tests/compiledWeStages.test.mjs SHA5da866d0f5d41ae45a612fcb561a80b30f02ec9bcbe7c3a8dfea83714d37f73d。
- 不通过改原测试凑绿。若实际阶段脚本 API seam 不匹配，只修 QA 到真实契约并保存拒绝回执，产品不动。

## 本地精确 SDK 和签名

- ~/lw_build/we-handshake-20261115/sdk-exact-private/jerry.exact：7cb8...原二进制（约592KB）。
- qemu-x86_64 已安装。用 x64-sysroot/lib/x86_64-linux-gnu/ld-linux-x86-64.so.2 及同目录库执行 guest；lib64/ld-linux-x86-64.so.2 是绝对 symlink，本机直接 stat 跟随会找不到，不据此说环境丢了。
- 仅 guest 子进程清除 Android LD_PRELOAD；不改 SDK 哈希或 --parse-only。原 final_gate.py 不改：签后另逐份提取 JS 经相同 binary 验七份，与 CI 裁决分开留证。
- 1.1.16/code1000119；certs/elcton.p7b SHA29675fba03bc5be63ba4072c4ab0daec58090c9df3447496b52892c6dd0c764e，watchapp.nexus.0zzip。显式配对私钥现取不回显；cerRoot含 Huawei Root+中间链。配置包内 write_key 可提取，仅本地用户交付，绝不推 GitHub，read_key/私钥不上包。
- 未配置 public APP 全绿后本地 configure_we_logger_app.py；只 app.js/map 值替换、完整逐文件差分；配置后重新原SDK解析、HOST、HTTPS、签后强验/同链/1B负例。

## 续跑顺序（唯一主线，禁止旁支）

1. 读本断点和最后六路径哈希；最后新增增量 SPEC/QUALITY 已通过，回执与当前哈希已核。无代码漂移就不重做这两次审查，也不重审原产品/355。
2. 提交/推最小 script+workflow+新增测试；必须带300B公开helper原件（已在a935911）。读回精确head，跑 wearengine-watch。活动修补尚未提交，新CI未跑。
3. 新 CI 原 tests/真实 SDK build/分享/压缩/签名/原 exact SDK 门全部成功。若失败，取 FAILED-NOT-FOR-INSTALL artifact 的 actual-pre-share.app 和 source-sha，直接按实际字节定位，不猜结构、不降门。
4. 成功 actual APP 用配置后 JS/map、精确七JS SDK解析、上述HOST和阶段HOST、Node HTTPS→认证云API/canonical raw/独立collector闭环实跑。不把宿主 ACK 叫手表成功。
5. 同身份/同链签 HAP，完整强验、payload/版本/资源、1B反例、签后七JS精确解析；最后交付 /haps/ 根只留最新elcton，旧elcton只mv旧包归档，不rm、不碰表盘子目录和其他产品。
6. SHA256工具计算、GitHub证据精确回读、Documents唯一进度更新。真机 WE 根因若仍未知，如实保留 unknown。

明早步骤不变：用户装新HAP→表周视图→同步→开始接收（常亮）→我手机MCP devices_list→sync_connect→sync_state→start_publish→回读；失败拉表logger和手机error_tail/diag_read。当前无新包可做此验收，不自动拉起手机/装表。
