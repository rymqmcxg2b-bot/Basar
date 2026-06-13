# SPDX-License-Identifier: Apache-2.0

from typing import Any
from hacker_librarian_api.providers.ai_base import AIProvider


class MockAIProvider(AIProvider):
    async def generate(self, prompt: str, context: list[dict[str, Any]], settings: dict[str, Any] | None = None) -> str:
        citations = ", ".join(item["id"] for item in context)
        return f"Based on the local library evidence, answer the question with citations: {citations}."

    async def health_check(self) -> dict[str, Any]:
        return {"provider": "mock", "ok": True}
