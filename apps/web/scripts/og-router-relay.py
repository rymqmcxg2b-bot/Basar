#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0

"""Local-only emergency 0G Router relay for Basar recordings.

This relay is intentionally small and standard-library-only. It keeps the
Router API key in this Python process memory and never prints request bodies,
response bodies, Authorization headers, or the key itself.
"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request


HOST = "127.0.0.1"
PORT = int(os.environ.get("OG_RELAY_PORT", "8787"))
UPSTREAM = os.environ.get("OG_ROUTER_BASE_URL", "https://router-api.0g.ai/v1").rstrip("/")
ALLOWED_ORIGINS = {
    "http://127.0.0.1:4173",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
}

API_KEY = os.environ.get("OG_ROUTER_API_KEY", "").strip()


def log_request_status(method, path, status):
    print(f"{method} {path} -> {status}", flush=True)


def cors_headers(origin):
    if origin not in ALLOWED_ORIGINS:
        return {}
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "content-type, authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Vary": "Origin",
    }


class RelayHandler(BaseHTTPRequestHandler):
    server_version = "BasarPython0GRelay/1.0"

    def log_message(self, _format, *_args):
        return

    def origin(self):
        return self.headers.get("Origin", "")

    def send_headers(self, status, content_type="application/json", extra=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        for key, value in cors_headers(self.origin()).items():
            self.send_header(key, value)
        if extra:
            for key, value in extra.items():
                self.send_header(key, value)
        self.end_headers()

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_headers(status, "application/json", {"Content-Length": str(len(body))})
        self.wfile.write(body)
        log_request_status(self.command, urllib.parse.urlparse(self.path).path, status)

    def read_body(self):
        length = int(self.headers.get("Content-Length", "0") or "0")
        return self.rfile.read(length) if length else b""

    def do_OPTIONS(self):
        path = urllib.parse.urlparse(self.path).path
        if self.origin() not in ALLOWED_ORIGINS:
            self.send_json(403, {"error": "relay_error", "message": "Origin is not allowed by this local relay."})
            return
        self.send_response(204)
        for key, value in cors_headers(self.origin()).items():
            self.send_header(key, value)
        self.end_headers()
        log_request_status("OPTIONS", path, 204)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/setup":
            self.send_setup()
            return
        if parsed.path == "/health":
            self.send_json(200, {
                "ok": True,
                "relay": "basar-python-0g-router-relay",
                "key_loaded": bool(API_KEY),
                "upstream": UPSTREAM,
            })
            return
        if parsed.path == "/v1/models":
            if not API_KEY:
                self.send_json(401, {
                    "error": "relay_key_missing",
                    "message": "Open http://127.0.0.1:8787/setup and save a key for this session.",
                })
                return
            self.forward_to_router("GET", parsed, None)
            return
        self.send_json(404, {"error": "relay_error", "message": "Unsupported relay route."})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/setup":
            self.save_setup_key()
            return
        if parsed.path == "/v1/chat/completions":
            if not API_KEY:
                self.send_json(401, {
                    "error": "relay_key_missing",
                    "message": "Open http://127.0.0.1:8787/setup and save a key for this session.",
                })
                return
            body = self.read_body()
            self.forward_to_router("POST", parsed, body)
            return
        self.send_json(404, {"error": "relay_error", "message": "Unsupported relay route."})

    def send_setup(self):
        html = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Basar Local 0G Router Relay</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; max-width: 680px; line-height: 1.5; }
    label, input, button { display: block; width: 100%; box-sizing: border-box; }
    input, button { font: inherit; margin-top: 8px; padding: 10px 12px; }
    button { cursor: pointer; }
    .warning { color: #8a4b00; font-weight: 700; }
  </style>
</head>
<body>
  <h1>Basar Local 0G Router Relay</h1>
  <p class="warning">The key is kept only in this local Python process memory. Do not record this page.</p>
  <form method="post" action="/setup" autocomplete="off">
    <label>
      0G Router API key
      <input type="password" name="api_key" autocomplete="off" required>
    </label>
    <button type="submit">Save key for this session</button>
  </form>
</body>
</html>"""
        body = html.encode("utf-8")
        self.send_headers(200, "text/html; charset=utf-8", {"Content-Length": str(len(body))})
        self.wfile.write(body)
        log_request_status("GET", "/setup", 200)

    def save_setup_key(self):
        global API_KEY
        body = self.read_body().decode("utf-8", errors="replace")
        data = urllib.parse.parse_qs(body, keep_blank_values=False)
        API_KEY = (data.get("api_key", [""])[0] or "").strip()
        if not API_KEY:
            self.send_json(400, {"ok": False, "message": "No key was provided."})
            return
        html = """<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Basar Local 0G Router Relay</title></head>
<body>
  <h1>Key saved for this session</h1>
  <p>The key remains only in this local Python process memory. Do not record this page.</p>
  <p><a href="/health">Check relay health</a></p>
</body>
</html>"""
        body_bytes = html.encode("utf-8")
        self.send_headers(200, "text/html; charset=utf-8", {"Content-Length": str(len(body_bytes))})
        self.wfile.write(body_bytes)
        log_request_status("POST", "/setup", 200)

    def forward_to_router(self, method, parsed, body):
        upstream_path = parsed.path[3:] if parsed.path.startswith("/v1/") else parsed.path
        target = f"{UPSTREAM}{upstream_path}"
        if parsed.query:
            target = f"{target}?{parsed.query}"

        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": self.headers.get("Content-Type", "application/json"),
        }
        request = urllib.request.Request(target, data=body, headers=headers, method=method)
        started = time.time()
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                response_body = response.read()
                status = response.getcode()
                content_type = response.headers.get("Content-Type", "application/json")
        except urllib.error.HTTPError as error:
            response_body = error.read()
            status = error.code
            content_type = error.headers.get("Content-Type", "application/json")
        except urllib.error.URLError as error:
            self.send_json(502, {
                "error": "relay_error",
                "message": f"Upstream request failed: {error.reason}",
            })
            return

        self.send_headers(status, content_type, {"Content-Length": str(len(response_body))})
        self.wfile.write(response_body)
        elapsed_ms = int((time.time() - started) * 1000)
        log_request_status(method, parsed.path, f"{status} {elapsed_ms}ms")


def main():
    server = ThreadingHTTPServer((HOST, PORT), RelayHandler)
    print(f"Basar Python 0G Router relay listening at http://{HOST}:{PORT}", flush=True)
    print(f"Upstream base URL: {UPSTREAM}", flush=True)
    print("Open http://127.0.0.1:8787/setup to save a key for this session.", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
