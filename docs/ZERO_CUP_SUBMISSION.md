# Basar — Multi-AI Evidence Workspace Powered by 0G

## Summary

Basar lets users ask multiple 0G AI models the same question over the same
sources, compare their answer cards, preserve citations, and export or publish a
portable growth package.

## Problem

AI research tools often produce one answer from one model with weak source
memory. Users cannot easily compare multiple model responses over the same
evidence package, preserve the citations behind those answers, or move the
review record into a user-owned archive.

## Solution

Basar is a browser-local evidence workspace. Users add lawful source text, open
the Review workspace, run the parallel AI Bench review across selected 0G
Router profiles, compare answer cards, and preserve the review as a
`basar.growth-package.v1` package.

## What 0G Does

- 0G Router is the active inference layer for the Zero Cup demo path.
- Each enabled AI profile uses a user-owned Router endpoint, model, and API key.
- Basar sends the same retrieved evidence package to each selected model.
- Each model returns one answer card with provider, model, status, answer,
  citations, and uncertainty or error.
- Growth packages can include `parallel_reviews` records and can be exported or
  published to a user-controlled 0G-compatible storage endpoint.

## Demo Flow

1. Load or add lawful sources.
2. Configure multiple 0G AI profiles.
3. Open the Review workspace.
4. Run the parallel AI Bench review with one question.
5. Basar retrieves the same evidence package for every selected profile.
6. Each profile independently returns one answer card.
7. Inspect the 0G Proof Panel.
8. Export or publish the portable growth package.

Local mode is the offline fallback. The Zero Cup demo path uses 0G Router as the
active inference layer.

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
2. Load the demo source or add a lawful source.
3. Add two AI profiles with user-owned 0G Router credentials.
4. Open the Review workspace and run one parallel AI Bench review.
5. Confirm each answer card shows profile, provider, model, status, answer,
   citations, and uncertainty or error.
6. Export the growth package and confirm it includes `parallel_reviews`.

## Pre-existing Foundation and Zero Cup Work

Basar had a pre-existing local-first research librarian foundation. The Zero Cup
submission focuses on the 0G-powered multi-AI evidence workflow, AI Bench,
parallel review records, proof panel, and submission documentation.

Do not claim the whole repository started after June 15.

## Known Limitations

- The public build is browser-local, not a hosted SaaS.
- Users must provide their own 0G Router and storage credentials.
- AI Bench does not create autonomous agents or orchestrate tasks.
- Storage publishing accepts compatible gateway responses; production teams
  should verify current official 0G SDK/API behavior before relying on it.
- Local fallback can search saved sources without Router credentials, but it is
  not the primary Zero Cup judging path.

## No Secrets / User-Owned Keys

Basar does not ship shared Router keys, wallet keys, API keys, private archives,
or local databases. AI profiles and storage credentials are entered by the user
and stored only in that user's browser if they choose to use the public web app.
