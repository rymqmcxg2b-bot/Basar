# AI Provider Abstraction

Providers implement `generate` and `health_check`; providers may also implement `embed`. The MVP includes mock, Ollama-compatible, OpenAI-compatible, and 0G Compute scaffold providers. Credentials are environment variables only.
