# Quickstart

```bash
python -m pip install -e 'apps/api[test]'
python -m pip install -e apps/cli --no-deps
hacker-librarian init
hacker-librarian ingest-file examples/sample_public_domain_texts/knowledge_trail.txt
hacker-librarian ask "What should research tools preserve?"
```
