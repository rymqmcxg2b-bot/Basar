# Basar Zero Cup Recording Rehearsal

## Architecture

```text
Browser Basar UI -> local user-owned 0G relay -> 0G Router
```

The browser workspace remains local-first. The real 0G Router key stays outside
the browser and is read only by the local relay from `OG_ROUTER_API_KEY`.

## Terminal 1: Basar UI

```bash
cd apps/web
node --run preview:recording
```

Recording URL:

```text
http://127.0.0.1:4173/?recording=1
```

## Terminal 2: 0G Router Relay

```bash
cd apps/web
OG_ROUTER_API_KEY="YOUR_KEY_HERE" node --run relay:0g
```

Relay URL:

```text
http://127.0.0.1:8787
```

Do not record Terminal 2.

## Basar Profile Fields

Profile name:

```text
0G Growth Reviewer
```

Endpoint:

```text
http://127.0.0.1:8787/v1
```

Model:

```text
qwen3.6-plus
```

API key field:

```text
local-demo-key
```

Profile name:

```text
0G Risk Reviewer
```

Endpoint:

```text
http://127.0.0.1:8787/v1
```

Model:

```text
deepseek-v4-flash
```

API key field:

```text
local-demo-key
```

Profile name:

```text
0G IC Memo Reviewer
```

Endpoint:

```text
http://127.0.0.1:8787/v1
```

Model:

```text
glm-5.2
```

API key field:

```text
local-demo-key
```

Enable all three profiles.

## Recording Flow

1. Open `http://127.0.0.1:4173/?recording=1`.
2. Load the investment demo.
3. Add the three profiles above.
4. Open Review.
5. Run this investment memo prompt:

```text
I am preparing a first-pass investment memo. Based only on these sources, what should I believe, what should I doubt, and what should I verify next? Do not give a buy or sell recommendation.
```

6. Run review.
7. Show answer cards.
8. Show the 0G Proof Panel.
9. Export the growth package.
10. Point to `parallel_reviews` in the exported package.

## Narration Replacement

Use this instead of saying the browser stores the Router key:

```text
For this recording, Basar uses a local user-owned relay, so the 0G Router key
stays outside the browser. The Review workspace still sends the same evidence
package to multiple 0G models and preserves the answer cards.
```

## Safety

- Do not record Terminal 2.
- Do not commit shell history.
- Do not commit `.env` files.
- Do not commit screenshots or recordings with secrets.
- Do not paste the real Router key into Basar's browser UI.
- Use `local-demo-key` in the browser profile API key field if the UI requires a value.
- The relay strips or ignores the browser Authorization header and uses
  `OG_ROUTER_API_KEY` for upstream Router calls.
