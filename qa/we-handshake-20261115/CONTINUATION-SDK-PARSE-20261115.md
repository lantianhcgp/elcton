# CONTINUATION：WE 表端 1.1.16 原生解析阻塞，尚未交付

## 原任务与红线
用户授权过夜仅修 elcton watch 的 WE 握手诊断及可证缺陷，内置应用级 logger，同步页常亮；原测试不得改断言、RED/拒绝原件保留。手机仓 ~/elcton-phone-release-029-20261114 只读，手机0.2.9/code11不重建、不装机、不抢前台；不点表、不动表盘与留白、不用Chromium。没人操作手表，真实握手留明早。不删证据，旧HAP只能mv归档；未验全部门不得交付。根因及证据在GitHub，本地Documents只更新既有进度文件。

## 精确断点
- 隔离工作树：/data/data/com.termux/files/home/we-handshake-repair-20261115-watch。
- 仓库：lantianhcgp/elcton，隔离分支fix/we-handshake-logger-20261115，master与其他工作树不动。
- 已推产品候选：a197eecb83a6e15a7f4cdb930c1205ec9c84b1ef。基线83d58a8，现装构建73c7823/1.1.15。
- 当前源码版本1.1.16/code1000119；目标签名身份watchapp.nexus.0zzip，certs/elcton.p7b，私钥只读~/hw_watch/agc-cert/key.pem；cerRoot必须保留Root+中间链。没有重新申请/修改证书。
- 原33文件（32测试+loader）与基线逐字保留；手机74保护文件哈希在提交前未变。a197eec全量源测试355/355、0失败0跳过。新增45 WE、27常亮、17logger、4流水线、11包门负控。SPEC→QUALITY都对精确源hash通过；报告reviews/spec-review.json、quality-review.json。
- 精确CI43620391145：https://github.com/lantianhcgp/elcton/actions/runs/43620391145 。全量355测试、真实SDK debug编译、包字节/48KiB预算、CMS验签通过，最终exact SDK gate拒phone-sync.js=46653B。**CI整体失败，无artifact、无合格新HAP、未交付。**后面的页面解析不能从提前中断推为通过。
- 原CI失败日志evidence/ci-43620391145-all.log，SHA256 6bf37c311add34081ad0903cb524571c779cab59fd1efce6a7050238d43b9a40。日志报告phone-sync SHA d5aa9f636feca64c471bd4c69668a3c52a51dfc9020e0c25c635235017251130；尚无本地actual新APP字节。
- 原SDK SHA7cb8af6c01f4848216f429bf35d1d497734ee299e055f3f93d58a4d176cfda31。final_gate只显示stderr，未存native returncode/stdout。唯一解析失败原因unknown；不要把外层Python exit1当native码。

## 已证修复与结论边界
1. 华为SDK native send fail(data,code)官方映射206，success207。SEND_0只是旧第二参命名，非发送成功。新表端保留两参安全数值/类型及固定阶段，不记原始课表、凭据或自由错误字符串。
2. reply失败覆盖注册摘要已RED复现并修复；截图没有SDK/REG不证明未注册。
3. 晚到REG失败作废旧代际、版本末段数值兼容；没有换P2P总线或对端身份。
4. Android p2p_capability=0是支持，1不支持、2未知；10月10日成功是公网fetch取件码，不是WE成功金样。不能用这两项硬猜握手根因。
5. 新包尚无真机，四轮双向WE失败的唯一底层根因仍unknown。本轮仅可称已证诊断/生命周期缺陷修复候选，不得称握手修好。
6. 用户令A源已接应用级logger：SDK/VER/PKG/CERT/REG/HELLO/READY/SEND。canonical2921B加null/timer兼容生成3018B；public CI只有占位，真实WRITE配置下载后本地注入，read_key不入表包/CI。源测试通过不证明云端/表源。
7. 用户令B源已接@system.brightness，show开、hide/back/destroy恢复，27生命周期测试绿；系统常亮期限/盖屏仍待设备。

## 停止时新增但未完成的QA
- .github/workflows/wearengine.yml新增failure-only取证旁路：原gate、test、SDK参数/48KiB不变，FAILED-NOT-FOR-INSTALL artifact只含public APP、sourceSHA、诊断JSON，不上传单独HAP，不加continue-on-error。**尚未提交新CI/运行。**
- native_parse_diagnostic.py：抓取原public APP所有JS同SDK --parse-only。R1独立审查SPEC通过、QUALITY拒Q1(text=True丢字节)、Q2(timeout/launch丢前序row)。原审查reviews/native-diagnostic-review.json必须保留。
- 第三fix子任务已派：只改上述helper、新增test_native_parse_diagnostic.py，要求先保存原helper和RED，再binary base64/hex+len/SHA、timeout/launch status/null returncode保partial及前序rows。停止时子任务已不live，但**父未读回最终文件/测试，不能称修好**。继续先看实际文件/回执，再R2独立审查，不覆盖R1。
- compiled-logger-host.mjs、README-compiled-logger-host.md为独立HOST QA：输入真实SDK APP字节，ViewModel/requireNative/timer/Node inspector观察实际L引用；public disabled与configured分开。仅参数/源码/旧页负例和inspector自检跑过，无新APP正控。public-build有占位key，预期enabled，运行时须选configured而不是public；README的public禁用用法对public-build不适用，需修正文案/明确模式后审查。
- compiled-logger-https.mjs父新写，**尚未node --check/审查/运行**。计划实际configured APP + Node HTTPS transport，stage/marker云端及独立collector读回；所有输出必须标HOST非FIT3/非真实WE。需先审查异常脱敏及关闭所有句柄，不可输出实际endpoint/key。
- research/native-parse-investigation.md为8min只读调查：旧真实40979B包在本地同源48KiB引擎可解析，合成48011B模块压力探针rc10双空输出，512KiB通过。**非a197eec实际编译复现，非exactSDK根因。**两本地Jerry位于liubai-s67-native-jerry/build-s67-clang-512/bin/jerry与build-s67-effective512/bin/jerry，只读不碰另项目源码/进程。不得调高SDK堆放行。

## 续棒最短路径
1. 读本文件→PLAN/ROOT-CAUSE/reviews/native-diagnostic-review及实际helper/测试，核对git status和子回执；避免复做已绿355。
2. R1两真实缺陷修正的新增测试父复跑，独立R2规格→质量绑定新hash；只有通过才推取证旁路。旧原件/门禁逐字冻结。用[skip ci]证据提交不代表构建绿。
3. failure-only取证CI仍会FAILED，下载唯一FAILED-NOT-FOR-INSTALL实际public APP和诊断，核source-sha/JS sha；解析原生returncode/stdout/stderr，并对actual输入做最小差分。不要拿旧.app/源码合成品充新APP。
4. 若证实parse heap，合法源去重/降低模块包装与临时解析压力，功能、原断言、SDK/签名/48KiB/AST门不变。新增RED→GREEN、全量源回归、SPEC→QUALITY重新精确绑定、再新CI全绿。
5. 仅全绿新APP下载后：实际compiled lifecycle HOST正控→scripts/configure_we_logger_app.py只改app.js/现存map、其余所有资源相等→实际configured compiled HOST/Node HTTPS→cloud exact row读回→独立collector同cursor逐字段比对。仅HOST网络，不称watch源。
6. certs/elcton.p7b+显式key同链签HAP→legacyCMS+profile独占leaf/payload digest/版本/全资源/1B反例+真实SDK解析证据绑定最终配置字节（不能以public CI代替配置后解析）。必要本地exactSDK不可用如实标阻塞，不改门。
7. 最终合格HAP才放/storage/emulated/0/haps/elcton-实际日期-说明-1.1.16-sha7.hap。只mv旧elcton HAP到旧包归档，表盘等子目录不碰，复制后SHA及强门复验；未交付时旧包不归档。
8. GitHub ROOT-CAUSE/DELIVERY证据push后精确目标读回；Documents进度含版本/改动/实际测试数/HAP SHA/验收步骤。若时限再到，准确CONTINUATION，不冒称完成。

## 明早验收（写入最终交付，当前无新包可执行）
用户装合格新HAP→周视图→同步→开始接收；同步页常亮效果与退出恢复确认。发起方手机MCP devices_list→sync_connect→轮询sync_state→start_publish→courses_read/表回读。失败立即拉表logger(字段log.msg)及手机error_tail/diag_read，不把rows0当未运行。MCP token现场读取不入证据；手机原版本只读，若根因在手机侧建议补丁留用户拍板。

## 本地唯一进度
/storage/emulated/0/Documents/elcton-WearEngine-真机联调-20261113-123000/进度.md

本棒按运行时限停止。没有启动额外Chromium/手机前台/表安装；本次无新可安装HAP、SHA为null。续棒不能自动把停靠报告当真机验收通过。
