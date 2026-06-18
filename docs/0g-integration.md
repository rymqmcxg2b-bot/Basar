# 0G Integration

0G is optional at runtime. The local MVP works without 0G, but the public direction is 0G-first: users can bring their own 0G Router and 0G Storage compatible endpoints to turn source collections into portable network activity.

## User-Owned Operation

- Public users must not route through the founder's local machine.
- Public users must not depend on shared project credentials.
- Browser users enter their own Router endpoint, model, API key, and optional Storage endpoint.
- Server/self-hosted users keep 0G credentials in environment variables only.
- Dry-run mode stays safe by default for local development and demos.

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
