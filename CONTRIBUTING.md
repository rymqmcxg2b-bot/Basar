# Contributing

Thank you for helping Basar become a better local-first research tool.

## Development Setup

```bash
python -m pip install -e 'apps/api[test]'
python -m pip install -e apps/cli --no-deps
python -m pytest apps/api
```

## Coding Style

Keep provider integrations behind interfaces. Prefer deterministic, auditable behavior for source scoring. Do not add hidden network calls to local-first workflows.

## Adding Connectors

Connector PRs must document provenance, storage behavior, secrets handling, and deletion/export behavior.

## Prohibited Contributions

Do not contribute copyrighted books, paywalled articles, private archives, scraped private data, API keys, private keys, wallet secrets, cookies, or tokens.

## Pull Requests

Include tests for behavioral changes. Schema changes should start with an RFC issue.
