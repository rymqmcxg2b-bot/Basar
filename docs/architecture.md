# Architecture

Basar is a monorepo with a FastAPI backend, SQLite metadata store, local archive provider, CLI, and Vite web UI.

Provider abstractions keep AI and storage replaceable. The MVP uses SQLite FTS5 for local retrieval and a mock AI provider for deterministic offline behavior.
