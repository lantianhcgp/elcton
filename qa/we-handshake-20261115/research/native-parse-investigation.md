# a197eec 原生解析调查（只读，2026-11-15）

## 结论

- **确证：本地同源 Jerry 能复现“48 KiB 文件门限以内、`--parse-only` 静默 OOM”。**但这不是 a197eec 实际 CI payload 的复现，不得把推断提升为 exact SDK 根因。
- **a197eec exact SDK 根因仍 unknown。**CI 未保存失败 SDK 进程返回码/stdout；本轮没有实际新 compiled `phone-sync.js`，没有找到可用 exact SDK/qemu 路径，未启动或等待第二次 CI。
- 调查全部使用读取、内存探针和既有二进制；没有修改 product/tests/门禁、引擎源码/配置，没有构建、安装、浏览器或 CI 操作。唯一新文件为本报告。

## CI 原件确证

工作树提交 `a197eecb83a6e15a7f4cdb930c1205ec9c84b1ef`。

`qa/we-handshake-20261115/evidence/ci-43620391145-all.log`：
- SHA256 `6bf37c311add34081ad0903cb524571c779cab59fd1efce6a7050238d43b9a40`，322802 B。
- 行 2395/2397/2398：tests 355 / pass 355 / fail 0。
- 行 2726：实际 SDK debug build successful。
- 行 2731–2734：格式压缩 + page-local alpha rename 后 `phone-sync` 46653 B；最终 JS SHA256 `d5aa9f636feca64c471bd4c69668a3c52a51dfc9020e0c25c635235017251130`（这是日志中的产物 hash，非本地新文件 hash）。其余页面 10614–43685 B；字节/公开产物 gate 通过。
- 行 2754：CMS/profile 与 full package digest 验证通过。
- 行 2763–2770：`final_gate.py:103` 报 `SDK parse rejected assets/js/MainAbility/pages/phone-sync/phone-sync.js:`，冒号后没有 stderr。

`qa/we-handshake-20261115/final_gate.py` SHA256 `cb8eaaebba788afae2b44dbc1c7bc82bb9aa37f0ac30fe2100e4678df9cfb210`：
- 行 99 先断言 exact SDK SHA256 `7cb8af6c01f4848216f429bf35d1d497734ee299e055f3f93d58a4d176cfda31`。
- 行 101 对每份实际签名 JS 独立启动 `[sdk, '--parse-only', path]`，timeout=30。
- 行 102 仅把 returncode/stderr 放入内存列表；行 103 失败即抛异常；行 116–118 结果文件/print 在 verify 成功后才执行。因此失败码、先前页的结果与 stdout 都未落盘，临时 JS 也被清理。
- 该 traceback 是非零退出断言，不是 TimeoutExpired；不能把外层 Python exit code 1 当 SDK exit code。
- 循环遇到 phone-sync 即终止：不能仅凭此原件称其后 sync/week 的本轮 native parse 也通过。

## 已有本地引擎与旧 compiled 对照

本地 Jerry 源版本 `3ff03a7a5472e483fed4466deff6b636e486ca1b`，CLI Version 2.3.0；**两份都不是 exact SDK**。

| 路径（相对 HOME） | SHA256 | 实际 CLI heap |
|---|---|---:|
| `liubai-s67-native-jerry/build-s67-clang-512/bin/jerry` | `b6ce31b0b11e0ecc2011b1b85590eb3e9bb1315a96c01aa3704b522ba85cdd30` | 49144 B |
| `liubai-s67-native-jerry/build-s67-effective512/bin/jerry` | `4746ad8cfe8cf48fa0e0dd80611c7cafb5c336478bfa500adf088183fe79220f` | 524280 B |

两份 CMakeCache 都写 heap=512；clang 版本实际仍 48 KiB。源码 `jerry-core/config.h:61–64` 在 Linux 默认先定义 48；effective512 编译 flags 才显式 `-DJERRY_GLOBAL_HEAP_SIZE=512`。本轮仅读取，不改配置。`config.h` SHA256 `c3b089a9045fb67b39a3c8c6cfd95676b306dacffe5f71a44d68a131248d95f7`。

旧 **1.1.15/73c7823** 签名包：
- 实际路径 `/storage/emulated/0/haps/elcton-20261114-P2P准备回执-1.1.15-73c7823.hap`。
- HAP SHA256 `8865474d76d278f6d61050f4cebca1c1a70b0f5f391f653523d9c9018c91bac0`，与历史交付记录一致；用现有 `qa/verify_final_artifacts.py:unpack_signed` 在内存读 file table。
- compiled phone-sync = 40979 B，SHA256 `787a251ee68bb104df111415fca13b60f83d4643ae719323676a5e2fd091ddf3`。
- 两份本地引擎均 `--mem-stats --parse-only -` 通过；phone-sync 峰值 44064 B，bytecode 峰值 27392 B，string 峰值 9812 B。其他六份旧 JS 也全部通过。
- 历史 `qa/p2p-ready-20261114/evidence/actual-hap-local-gate-73c7823.json` 的 `ci_native_parse_same_payloads` 记录这七份旧 JS exact SDK 均 rc=0；该记录 SHA256 `6cbb8c6dab2019df8d4530cad7f16f7c463b16ecaa4e040e20df9fb9d9876330`。

## 只读解析压力实验（非新产品/非验收测试）

全通过 stdin，未落地合成 JS。使用旧 compiled bundle 同一 webpack module object（Acorn ES5 读取，旧对象结束位置 offset 40728），在其中添加不执行的函数模块。模块体来自当前 `wearTrace.js`，仅 `export default` 改为 `t.default =`；Terser 5.31.6 `compress:false,mangle:false,format:{comments:false,ascii_only:true}`，每份 2321 B。

| 探针 | 输入 B | 49144 B heap | 524280 B heap |
|---|---:|---|---|
| 旧 compiled 原件 | 40979 | rc0，peak 44064 | rc0，peak 44064 |
| 原件补空格到同样 48011 B | 48011 | rc0，peak 44064 | 未重复运行此精确长度 |
| 同模块表增加 3 份格式压缩 trace | 48011 | **rc10，stdout/stderr 各0 B** | rc0，peak 47032 |
| 同模块表增加 4 份格式压缩 trace | 50355 | rc1，`Script Error: null` | rc0，peak 48232 |

48011 B 的静默失败探针 SHA256 `95f1febce58de721b6b3b9b0eeab8d8ce6acff80ce77b557163a244d6d2e323e`；普通 `--parse-only` 重复三次均 rc10/双空输出；加 `--mem-stats` 也 rc10/双空输出。同长度空格对照 SHA256 `a0f0ed27e0f2e3cbfc111404891910b5a55ecfd320702c7347111b6ac4f6d678`。

另一个排除：单独 trace ES5 探针在两份引擎均通过，峰值 3440 B；`Object.getOwnPropertyDescriptor`、`hasOwnProperty.call`、`Math.floor`、typeof 小探针也均 parse 通过。旧 bundle 同模块表加一份 trace + 一份 awake 的未格式压缩探针 45700 B，在两份引擎均通过，peak45048。**只新增 trace/awake 本身并不足以复现本次 CI。**这是 parse-only，不证明这些 API 在设备运行时可用。

源码对照说明两种 OOM 输出：
- `jerry-core/include/jerryscript-port.h:51`：`ERR_OUT_OF_MEMORY = 10`。
- `jerry-port/default/default-fatal.c:72–84`：OOM 不 abort，而直接 exit(code)，不输出错误。
- `jerry-core/parser/js/js-scanner-util.c:95–109`：scanner 分配失败设 `PARSER_ERR_OUT_OF_MEMORY`。
- `jerry-core/parser/js/js-parser.c:2730–2735`：parser OOM 可抛简单 null，因此 rc1/`Script Error: null` 同样可能是堆不足。

## 可重新执行的静默压力探针

下面命令仅读取并通过 stdin 解析，不写文件；HOME 与旧包路径保持原样。它生成的是上述合成探针，**不是 a197eec compiled 产品**：

```sh
python -c 'from pathlib import Path; import runpy,subprocess,hashlib
b=Path("/data/data/com.termux/files/home");r=b/"we-handshake-repair-20261115-watch"
h=Path("/storage/emulated/0/haps/elcton-20261114-P2P准备回执-1.1.15-73c7823.hap")
assert hashlib.sha256(h.read_bytes()).hexdigest()=="8865474d76d278f6d61050f4cebca1c1a70b0f5f391f653523d9c9018c91bac0"
_,f,_=runpy.run_path(str(r/"qa/verify_final_artifacts.py"))["unpack_signed"](h)
o=f["assets/js/MainAbility/pages/phone-sync/phone-sync.js"]
s=(r/"entry/src/main/js/MainAbility/common/wearTrace.js").read_text().replace("export default","t.default =")
n="const fs=require(\"fs\"),t=require("+repr(str(r/"tools/sign/node_modules/terser"))+");t.minify(fs.readFileSync(0,\"utf8\"),{compress:false,mangle:false,format:{comments:false,ascii_only:true}}).then(x=>process.stdout.write(x.code));"
x=subprocess.run(["node","-e",n],input=s,text=True,capture_output=True,timeout=5);assert x.returncode==0,x.stderr
w=lambda i:b","+str(i).encode()+b":function(e,t){"+x.stdout.encode()+b"}"
p=o[:40728]+b"".join(w(990001+i) for i in range(3))+o[40728:]
assert hashlib.sha256(p).hexdigest()=="95f1febce58de721b6b3b9b0eeab8d8ce6acff80ce77b557163a244d6d2e323e"
for d in ["build-s67-clang-512","build-s67-effective512"]:
 y=subprocess.run([str(b/"liubai-s67-native-jerry"/d/"bin/jerry"),"--mem-stats","--parse-only","-"],input=p,capture_output=True,timeout=5)
 print(d,len(p),y.returncode,repr(y.stdout),repr(y.stderr))'
```

## 给父调查的下一步（不降低原门禁）

1. failure-only artifact 必须保留 actual public APP/HAP、解析输入每页 bytes/hash、SDK hash/version/help，以及每页 **returncode+stdout+stderr**。单次失败不应中断附加诊断收集，但原 gate 仍失败；不要修改原 AST/sign/compaction/49152 断言。
2. exact SDK 对简单 ES5 文件跑 `--mem-stats --parse-only`，先取得**真实 heap**而非 cache/build 标签。OOM 可能导致 mem-stats 完全没有输出，所以保留 rc 与原件仍是必要条件。
3. 实际新 phone-sync 文件必须核对 `d5aa9f...251130` 才能声称复现本轮；同一原件在现有两份本地引擎做差分。如果仅48KiB版失败且exact SDK为同堆/rc10，OOM证据才闭合。新产物可能另有 syntax/limit/配置差异，当前不能排除。
4. 如 actual 证据指向 parse heap，再审查真实 bundle 的重复 helper、模块包装/字符串/嵌套函数与同一块存活压力，从源代码做合法小型去重，保留功能与测试；**不调 SDK heap，不拿512KiB本地通过替代exact SDK，不放宽49152**。本轮未提出或写入产品补丁。

本轮 bounded 发现：HOME 下只有上述两份可执行 Jerry；常见 ohos-sdk 路径、Alpine /root 与 /opt SDK 候选均未见；Termux/Alpine PATH 无 qemu-x86_64。不是全盘不存在的证明，也未安装任何替代工具。
