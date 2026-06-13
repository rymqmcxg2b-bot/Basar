# SPDX-License-Identifier: Apache-2.0

from typing import Any
import httpx
from hacker_librarian_api.config import Settings
from hacker_librarian_api.providers.ai_base import AIProvider


class OpenAICompatibleProvider(AIProvider):
    def __init__(self, settings: Settings):
        self.settings = settings

    async def generate(self, prompt: str, context: list[dict[str, Any]], settings: dict[str, Any] | None = None) -> str:
        if not self.settings.openai_compatible_base_url or not self.settings.openai_compatible_api_key:
            raise RuntimeError("OpenAI-compatible provider is not configured.")
        model = (settings or {}).get("model", "gpt-4.1-mini")
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{self.settings.openai_compatible_base_url.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {self.settings.openai_compatible_api_key}"},
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "Cite only provided source ids."},
                        {"role": "user", "content": f"{prompt}\n\nContext: {context}"},
                    ],
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def health_check(self) -> dict[str, Any]:
        return {"provider": "openai-compatible", "configured": bool(self.settings.openai_compatible_api_key)}
