# 0G Integration

Basar is a browser-local evidence workspace. It keeps source cards, claim
cards, review records, and exported growth packages under the user's control.
0G is the network layer for live inference, user-owned preservation workflows,
and future browser-native wallet-signed operation.

## Integration Paths

### 1. Local Fallback

- Browser-local sources.
- Evidence retrieval from the user's saved source text.
- Offline/non-model summaries when no model endpoint is configured.
- Exportable `basar.growth-package.v1` packages.

Local fallback is useful for privacy, demos without paid APIs, and continuity
when external model endpoints are unavailable. It is not presented as live 0G
inference.

### 2. Router Path

0G Router is the active inference path for server-side apps, agents, CLIs,
prototypes, self-hosted deployments, and user-controlled local relays.

Router API keys should stay outside the browser. For recording and rehearsal,
Basar uses a local relay at `http://127.0.0.1:8787/v1`. The browser sends the
same evidence package to the local relay, the relay injects
`OG_ROUTER_API_KEY` from the user's terminal environment, and 0G Router returns
real model responses as answer cards.

This is the recommended Zero Cup recording path.

The browser profile API key field can use a harmless placeholder such as
`local-demo-key` when the relay injects the real key upstream.

Static browser direct calls to the official Router endpoint may fail due to
CORS and browser credential boundaries. That failure is not necessarily an API
key problem.

### 3. Direct Browser Path

The future browser-native path is 0G Direct with wallet-signed requests. That
flow is better aligned with browser dApps because users sign with their wallet
instead of placing Router API keys in browser storage.

The Direct wallet-signed path is not implemented in this Group Stage version.

## Parallel 0G Review Flow

1. The user adds lawful source text.
2. The user configures multiple AI profiles against a CORS-compatible endpoint
   or the local user-owned relay.
3. Basar retrieves one evidence package from saved sources.
4. Basar sends that same evidence package to each selected model.
5. Each model returns one answer card with provider, model, status, answer,
   citations, and uncertainty or error.
6. Basar saves answer cards into the growth package as `parallel_reviews`.

## Proof Checklist

- Local relay is running.
- Profiles point to `http://127.0.0.1:8787/v1`.
- Models:
  - `qwen3.6-plus`
  - `deepseek-v4-flash`
  - `glm-5.2`
- Review uses the same evidence package.
- Answer cards show provider/model/status.
- Proof Panel shows successful providers.
- Growth package includes `parallel_reviews`.

## Storage Pointer Semantics

0G-compatible storage publishing remains a user-controlled compatible endpoint
/ pointer workflow. A compatible storage response may return one of:

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

The app stores the returned pointer with exported growth packages and source
archive metadata. Exported pointer metadata is not a guarantee of permanent
decentralized replication unless the user completes a valid storage publish
path.

Keep storage as export/pointer/scaffold unless configured.

## Production Rule

Before production use, developers must verify current official 0G SDK/API docs
and replace scaffolds where needed. Do not invent SDK calls, commit secrets,
publish founder-owned credentials, disable browser security, or use `no-cors`.
