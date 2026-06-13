# SPDX-License-Identifier: Apache-2.0

from typing import Any
import httpx
from hacker_librarian_api.config import Settings
from hacker_librarian_api.providers.ai_base import AIProvider


class OllamaProvider(AIProvider):
    def __init__(self, settings: Settings):
        self.settings = settings

    async def generate(self, prompt: str, context: list[dict[str, Any]], settings: dict[str, Any] | None = None) -> str:
        model = (settings or {}).get("model", "llama3.1")
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{self.settings.ollama_base_url.rstrip('/')}/api/generate",
                json={"model": model, "prompt": f"{prompt}\n\nCite only these sources: {context}", "stream": False},
            )
            resp.raise_for_status()
            return resp.json().get("response", "")

    async def health_check(self) -> dict[str, Any]:
        return {"provider": "ollama", "base_url": self.settings.ollama_base_url}
