#!/usr/bin/env python3
"""CI 签名验签闸门（2026-10-10 教训：Secret 取不到时表达式会静默回退到别的身份私钥，
包结构 15 项全对、装机却报错误 30）。

用法: python3 verify_sign.py <hap> [p7b路径]
signed.bin 布局: [unsignedBin][proBlock8][signBlock8][p7b][CMS][signHead32]
验签失败（签名 key 与 p7b 证书不配对）→ 退出码 1 → CI 直接失败、不产出 artifact。
"""
import glob
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile


def main():
    if len(sys.argv) < 2:
        print("用法: verify_sign.py <hap> [p7b]")
        return 2
    hap = sys.argv[1]
    raw = zipfile.ZipFile(hap).read("signed.bin")

    if raw[-32:-16] != b"hw signed app   ":
        print("FAIL: 缺 signHead（包结构异常）")
        return 1

    p7bs = []
    if len(sys.argv) > 2 and os.path.exists(sys.argv[2]):
        p7bs.append(open(sys.argv[2], "rb").read())
    for f in sorted(glob.glob("certs/*.p7b")):
        b = open(f, "rb").read()
        if b not in p7bs:
            p7bs.append(b)

    hit = None
    for b in p7bs:
        i = raw.find(b)
        if i >= 0:
            hit = (b, i)
            break
    if hit is None:
        print("FAIL: 包内 p7b 与已知证书都不匹配")
        return 1

    b, i = hit
    cms = raw[i + len(b):len(raw) - 32]
    if not cms or cms[0] != 0x30:
        print("FAIL: CMS 区间非法（起始非 DER 0x30）")
        return 1

    tdir = tempfile.mkdtemp()
    f = os.path.join(tdir, "c.der")
    open(f, "wb").write(cms)
    p = subprocess.run(
        ["openssl", "cms", "-verify", "-in", f, "-inform", "DER",
         "-noverify", "-purpose", "any", "-out", os.devnull],
        capture_output=True, text=True, timeout=60)
    shutil.rmtree(tdir, ignore_errors=True)

    if p.returncode == 0:
        print(f"PASS: CMS 签名验签通过（{len(cms)}B，签名 key 与 p7b 证书配对）")
        return 0
    tail = (p.stderr or "").strip().splitlines()
    print("FAIL: CMS 验签失败 —— 签名私钥与包内 p7b 证书不配对（装机必报错误30）")
    print("      " + (tail[-1] if tail else ""))
    print("      检查 matrix 的 SIGN_P12_PEM 是否回退到了别的身份")
    return 1


if __name__ == "__main__":
    sys.exit(main())
