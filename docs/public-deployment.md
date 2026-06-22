# Public Deployment

This deployment path keeps public traffic away from the developer machine. The
default public build is a static browser app: no project backend, no local
machine, and no shared server-side API key.

Users can add sources, run local fallback reviews, and export growth packages
from browser storage. Live 0G Router inference requires a CORS-compatible
endpoint, a user-controlled server-side/local relay, or the future Direct
wallet-signed browser path.

Do not expose local `localhost` services for public use.

## GitHub Pages

The repository includes `.github/workflows/pages.yml`. Enable Pages for the
repository with "GitHub Actions" as the source, then push to `main` or run the
workflow manually.

The deployed site is a static Vite build from `apps/web/dist`.

## Render Blueprint

1. Push this repository to GitHub.
2. In Render, create a new Blueprint from the repository.
3. Render creates `basar-web`, a static Vite build.

## 0G Router

The public web app does not include a shared 0G key. Official 0G Router API
keys should stay outside static browser storage. For recording, Basar uses a
local user-owned relay at `http://127.0.0.1:8787/v1`; the relay reads
`OG_ROUTER_API_KEY` from the user's terminal environment and forwards requests
to 0G Router.

## 0G Growth Packages

The web UI can package user-added sources and local claim cards into
`basar.growth-package.v1` JSON. Users can download the package or
publish it to a 0G Storage compatible endpoint they control. Returned URIs,
root hashes, or object ids can be shared as contribution references.

If 0G Router blocks browser requests with CORS, users need a CORS-compatible
endpoint, their own server-side/local relay, or the future 0G Direct
wallet-signed browser flow. Do not add a public shared proxy with the
maintainer's key.
