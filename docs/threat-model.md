# Threat Model

Risks include malicious files, prompt injection from documents, private data leaks, API key leaks, wallet/private key leaks, hallucinated citations, copyrighted content misuse, unsafe arbitrary shell execution, poisoned sources, and malicious connectors.

Mitigations include local-first defaults, no arbitrary shell execution, safe logging, dry-run destructive actions, source quality warnings, explicit user approval for 0G upload, secrets in environment variables only, and no private keys in the repository.
