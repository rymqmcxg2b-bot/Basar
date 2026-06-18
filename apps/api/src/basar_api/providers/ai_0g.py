# SPDX-License-Identifier: Apache-2.0

from typing import Any

import httpx

from basar_api.config import Settings
from basar_api.providers.ai_base import AIProvider


class ZeroGComputeProvider(AIProvider):
    """0G Compute Router provider.

    The Router is OpenAI-compatible, so server-side apps can use the same
    chat-completions shape while keeping 0G credentials in environment variables.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    async def generate(self, prompt: str, context: list[dict[str, Any]], settings: dict[str, Any] | None = None) -> str:
        if self.settings.zerog_dry_run:
            return "0G dry-run compute response. Verify official 0G SDK/API before production use."
        if not self.settings.zerog_compute_endpoint or not self.settings.zerog_api_key:
            raise RuntimeError("0G Compute Router endpoint/API key is not configured.")
        model = (settings or {}).get("model") or self.settings.zerog_compute_model
        if not model:
            raise RuntimeError("0G Compute model is not configured.")
        async with httpx.AsyncClient(timeout=self.settings.zerog_request_timeout_seconds) as client:
            response = await client.post(
                f"{self.settings.zerog_compute_endpoint.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {self.settings.zerog_api_key}"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "Answer only from provided context and cite source ids."},
                        {"role": "user", "content": f"{prompt}\n\nContext: {context}"},
                    ],
                },
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    async def health_check(self) -> dict[str, Any]:
        return {
            "provider": "0g-compute-router",
            "dry_run": self.settings.zerog_dry_run,
            "configured": bool(self.settings.zerog_compute_endpoint and self.settings.zerog_api_key),
            "compute_endpoint": self.settings.zerog_compute_endpoint,
            "model_configured": bool(self.settings.zerog_compute_model),
        }
