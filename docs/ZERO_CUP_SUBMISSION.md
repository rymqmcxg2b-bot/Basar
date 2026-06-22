# Basar — Multi-AI Evidence Workspace Powered by 0G

## Summary

Basar lets users ask multiple 0G AI models the same question over the same
sources, compare their answer cards, preserve citations, and export or publish a
portable growth package. For live 0G Router inference in the recording, Basar
uses a user-controlled local relay so Router API keys stay outside the browser.
Add sources once. Review with many AIs. Keep the evidence.

## Problem

AI research tools often produce one answer from one model with weak source
memory. Users cannot easily compare multiple model responses over the same
evidence package, preserve the citations behind those answers, or move the
review record into a user-owned archive.

## Solution

Basar is a browser-local evidence workspace. Users add lawful source text, open
the Review workspace, run the parallel AI Bench review across selected 0G
Router-compatible profiles, compare answer cards, and preserve the review as a
`basar.growth-package.v1` package.

## What 0G Does

- 0G Router is the active inference layer for the Zero Cup recording path.
- Each enabled AI profile uses a CORS-compatible endpoint or user-controlled local relay plus a selected model.
- The local relay reads `OG_ROUTER_API_KEY` from the user's terminal environment, not from browser storage.
- Basar sends the same retrieved evidence package to each selected model.
- Each model returns one answer card with provider, model, status, answer,
  citations, and uncertainty or error.
- The UI records provider, model, status, citations, and error metadata for
  each review card and proof panel run.
- Growth packages can include `parallel_reviews` records and can be exported or
  published to a user-controlled 0G-compatible storage endpoint.

## Demo Flow

1. Load or add lawful sources.
2. Configure multiple 0G AI profiles against `http://127.0.0.1:8787/v1`.
3. Open the Review workspace.
4. Run the parallel AI Bench review with one question.
5. Basar retrieves the same evidence package for every selected profile.
6. Each profile independently returns one answer card.
7. Inspect the 0G Proof Panel.
8. Export or publish the portable growth package.

Local mode is the offline fallback. The Zero Cup recording path uses 0G Router
through a local user-owned relay as the active inference layer.

The investment research demo uses fictional AsterGrid source cards and is not
investment advice.

## How To Run Locally

```bash
python -m pip install -e 'apps/api[test]'
python -m pip install -e apps/cli --no-deps
basar doctor
basar demo
python -m pytest apps/api apps/cli
```

Run the web app:

```bash
cd apps/web
npm ci
npm run smoke:zero-cup
npm run build
npm run dev
```

Manual Review / AI Bench test:

1. Open the web app.
2. Load the investment demo or add lawful source text.
3. Start the local relay with `OG_ROUTER_API_KEY` in a private terminal.
4. Add AI profiles that point to `http://127.0.0.1:8787/v1`.
5. Open the Review workspace and run one parallel AI Bench review.
6. Confirm each answer card shows profile, provider, model, status, answer,
   citations, and uncertainty or error.
7. Export the growth package and confirm it includes `parallel_reviews`.

## Pre-existing Foundation and Zero Cup Work

Basar had a pre-existing local-first research librarian foundation. The Zero Cup
submission focuses on the 0G-powered multi-AI evidence workflow, AI Bench,
parallel review records, proof panel, and submission documentation.

Do not claim the whole repository started after June 15.

## Known Limitations

- The public build is browser-local, not a hosted SaaS.
- Official 0G Router API keys are server-side credentials; static browser use needs a CORS-compatible endpoint or a user-controlled relay.
- Browser-native 0G Direct wallet-signed inference is a future path and is not implemented in this Group Stage version.
- AI Bench does not create autonomous agents or orchestrate tasks.
- Storage publishing accepts compatible gateway responses; production teams
  should verify current official 0G SDK/API behavior before relying on it.
- Local fallback can search saved sources without a Router endpoint or relay, but it is
  not the primary Zero Cup judging path.

## No Secrets / User-Owned Keys

Basar does not ship shared Router keys, wallet keys, API keys, private archives,
or local databases. For live Router recording, the key is provided only to the
local relay through `OG_ROUTER_API_KEY`; the browser profile can use a harmless
placeholder such as `local-demo-key`.
