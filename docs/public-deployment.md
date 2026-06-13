# Public Deployment

This deployment path keeps public traffic away from the developer machine. The
default public build is a static browser app: no project backend, no local
machine, and no shared server-side API key.

Users bring their own 0G Router endpoint, model, API key, and optional 0G
Storage compatible endpoint. Sources are stored in the user's browser storage
unless the user exports them or publishes a growth package to their own storage.

Do not expose local `localhost` services for public use.

## GitHub Pages

The repository includes `.github/workflows/pages.yml`. Enable Pages for the
repository with "GitHub Actions" as the source, then push to `main` or run the
workflow manually.

The deployed site is a static Vite build from `apps/web/dist`.

## Render Blueprint

1. Push this repository to GitHub.
2. In Render, create a new Blueprint from the repository.
3. Render creates `hacker-librarian-web`, a static Vite build.

## 0G Router

The public web app does not include a shared 0G key. Each user enters their own
Router endpoint, model, and API key in Settings. The key is used from that
user's browser only.

## 0G Growth Packages

The web UI can package user-added sources and local claim cards into
`hacker-librarian.growth-package.v1` JSON. Users can download the package or
publish it to a 0G Storage compatible endpoint they control. Returned URIs,
root hashes, or object ids can be shared as contribution references.

If 0G Router blocks browser requests with CORS, users need an official browser
SDK or their own proxy. Do not add a shared proxy with the maintainer's key
unless you are prepared to pay for every user's inference.
