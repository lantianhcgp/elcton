#!/usr/bin/env python3
"""课程表同步 · 局域网测试服务（手机侧）

用法：
    python3 tools/lan-server.py [端口=8123]

- GET /t.json   -> {"ok":true,"src":"lanok","ts":...}（探测页校验用）
- 每个请求都会打印「客户端 IP:端口 + 路径」，手表打过来时能直接看到它的来源子网
- 监听 0.0.0.0，手机在 Wi-Fi 内网的地址就是手表要填的目标（ip -4 addr 查 wlan0）

探测页对应地址：http://<手机内网IP>:8123/t.json
"""
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123

class H(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        ts = time.strftime("%H:%M:%S")
        src = "%s:%s" % (self.client_address[0], self.client_address[1])
        ua = self.headers.get("User-Agent", "-")
        if self.path.startswith("/t.json"):
            print("[%s] [HIT] %s -> %s UA=%s (手表内网可达性证据)"
                  % (ts, src, self.path, ua[:60]), flush=True)
            self._send(200, '{"ok":true,"src":"lanok","ts":%d}' % int(time.time()))
        else:
            print("[%s] [HIT] %s -> %s UA=%s" % (ts, src, self.path, ua[:60]), flush=True)
            self._send(404, '{"ok":false,"msg":"not found"}')

    def log_message(self, fmt, *args):  # 关掉默认日志（自己打印了）
        pass

if __name__ == "__main__":
    print("lan-server 监听 0.0.0.0:%d  目标地址 http://<手机内网IP>:%d/t.json" % (PORT, PORT), flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), H).serve_forever()
