# Security Boundary for Basar

This project must never include private prior-project materials or any other private trading, wallet, credential, or proprietary research data.

## Never Copy Into This Repo

- Trading alpha, strategy results, or signal logic.
- Risk parameters, portfolio logic, execution logic, or market-making details.
- Wallet keys, seed phrases, private keys, API keys, tokens, cookies, or credentials.
- Private datasets, private notes, private research conclusions, or internal operating procedures.
- Prior-project-specific code, prompts, reports, registries, or operational artifacts.

## Allowed Reuse

Only generic infrastructure patterns may be reused:

- Research save workflows.
- Knowledge card generation patterns.
- Evidence registry structure.
- Validation metadata patterns.
- Memory kernel structure.
- Provenance tracking.
- Markdown-based research artifact formats.
- Generic agent or research workflow organization.

## Review Rule

If a file mentions private trading, private markets, proprietary prior-project operations, wallets, credentials, API keys, or unpublished research conclusions, it is not eligible for direct copy.

Use clean-room rewriting: describe the generic pattern from memory, then implement it without copying private content.

## GitHub Rule

Before any commit or push, check staged files for:

- prior private project names
- `alpha`
- `strategy`
- `risk`
- `wallet`
- `private key`
- `api key`
- `token`
- `secret`
- `.env`
- private dataset paths

If any match is not an intentional security warning or generic documentation note, stop and review before publishing.
