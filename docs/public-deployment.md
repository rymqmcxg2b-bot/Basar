# Public Deployment

This deployment path keeps public traffic away from the developer machine.
Do not expose local `localhost` services for public use.

## Render Blueprint

1. Push this repository to GitHub.
2. In Render, create a new Blueprint from the repository.
3. Render creates:
   - `hacker-librarian-api`: FastAPI service with a persistent disk mounted at `/var/data`.
   - `hacker-librarian-web`: static Vite build.
4. After the API service URL is assigned, set the web service environment variable:
   - `VITE_API_BASE=https://YOUR_API_SERVICE_URL`
5. Restrict CORS after the web URL is assigned:
   - `CORS_ALLOW_ORIGINS=https://YOUR_WEB_SERVICE_URL`

## 0G Router

The default public deployment uses `AI_PROVIDER=mock` so no wallet or API key is
required to launch. To enable 0G Router later, set these API service environment
variables:

```bash
AI_PROVIDER=0g
ZEROG_DRY_RUN=false
ZEROG_API_KEY=...
ZEROG_COMPUTE_MODEL=...
ZEROG_COMPUTE_ENDPOINT=https://router-api.0g.ai/v1
```

Keep all 0G keys server-side. Never put wallet secrets or API keys in the web
frontend.
