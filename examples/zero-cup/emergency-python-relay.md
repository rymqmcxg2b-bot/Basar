# Emergency Python 0G Router Relay

Use this only when the Node relay is unavailable on the recording machine.
It is a local-only, user-owned relay, not a hosted proxy.

The relay keeps the 0G Router key only in Python process memory. It never
writes the key to disk and never prints request bodies, response bodies, or
Authorization headers.

## Start The Relay

```bash
cd /path/to/Basar
python3 apps/web/scripts/og-router-relay.py
```

Setup page:

```text
http://127.0.0.1:8787/setup
```

Health page:

```text
http://127.0.0.1:8787/health
```

## Basar Profile

Endpoint:

```text
http://127.0.0.1:8787/v1
```

Browser API key placeholder:

```text
local-demo-key
```

The relay ignores the browser Authorization header and injects the real key
server-side from the local Python process memory.

## Safety

- Do not record the `/setup` page.
- Do not record a terminal with secrets.
- Do not commit API keys.
- Do not paste real Router keys into Basar's browser UI.
- This relay is local-only and user-owned. It is not a public shared proxy.
