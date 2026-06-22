# Basar Web

Static Vite UI for 0G-first, browser-local Basar workflows.

```bash
npm install
npm run dev
```

The public build does not call a project backend. Users can add sources, run
local fallback reviews, and export a 0G growth package from browser storage.
Live 0G Router recording should use a CORS-compatible endpoint or a
user-controlled local relay such as `http://127.0.0.1:8787/v1`, so the Router
API key stays outside the browser.

```bash
node --run preview:recording
OG_ROUTER_API_KEY="YOUR_KEY_HERE" node --run relay:0g
```
