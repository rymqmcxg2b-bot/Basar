# 0G Integration

Basar is a multi-AI evidence workspace powered by 0G. It keeps an honest local
fallback, but the Zero Cup demo path uses 0G Router as the active inference
layer.

## Two Modes

### Local Fallback Mode

Local fallback mode lets users search saved browser sources and generate a
non-model evidence summary when no Router credentials are configured. This mode
is useful for privacy, offline review, and development, but it is not the main
Zero Cup judging path.

### Zero Cup Demo Mode

Zero Cup demo mode uses user-owned 0G Router profiles. Users configure one or
more Router endpoint/model/API-key profiles, run the same question over the same
retrieved evidence package, compare answer cards, and export or publish the
resulting growth package.

For the demo, 0G does real work in two places:

- 0G Router-compatible inference generates answers from retrieved local evidence.
- 0G-compatible storage publishing returns a pointer for portable
  `basar.growth-package.v1` archives.

## Parallel 0G Review Flow

1. The user adds lawful source text.
2. The user configures multiple 0G AI profiles.
3. Basar retrieves one evidence package from the saved sources.
4. Basar sends that same evidence package to each selected model.
5. Each model returns one answer card with provider, model, status, answer,
   citations, and uncertainty or error.
6. Basar saves answer cards into the growth package as `parallel_reviews`.

## User-Owned Operation

- Public users must not route through the founder's local machine.
- Public users must not depend on shared project credentials.
- Browser users enter their own Router endpoint, model, API key, and Storage endpoint.
- Server/self-hosted users keep 0G credentials in environment variables only.
- Dry-run mode stays safe by default for local API development. The public Zero
  Cup browser demo shows real Router/provider state when user credentials are
  configured.

## Zero Cup Proof Checklist

- Multiple AI profiles are configured.
- The same source package is used for the parallel review.
- Last provider shows `0g-router` for successful Router-backed reviews.
- Answer cards show provider, model, and status.
- Growth package includes `parallel_reviews`.
- Publish/export path produces a portable package.
- When storage publishing is configured, the Proof Panel displays the returned
  `uri`, `rootHash`, `root_hash`, `hash`, `id`, `ref`, `reference`, `url`,
  `location`, or `path` when available.

## Storage Pointer Semantics

The project treats 0G Storage results as portable pointers. A compatible storage response may return one of:

- `uri`
- `rootHash`
- `root_hash`
- `hash`
- `id`
- `ref`
- `reference`
- `url`
- `location`
- `path`

The app stores the returned pointer with exported growth packages and source archive metadata. The pointer is evidence metadata, not a guarantee that storage was globally replicated.

## Intended Use Cases

- Decentralized backup of lawful source collections.
- 0G-compatible AI compute for retrieval-grounded answers.
- Community source packages for education, verification, and shared memory.
- Future storage and retrieval experiments that preserve provenance.

## Production Rule

Before production use, developers must verify current official 0G SDK/API docs and replace scaffolds where needed. Do not invent SDK calls, commit secrets, or publish founder-owned credentials.
