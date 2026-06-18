# SPDX-License-Identifier: Apache-2.0

from abc import ABC, abstractmethod
from typing import Any


class AIProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, context: list[dict[str, Any]], settings: dict[str, Any] | None = None) -> str:
        raise NotImplementedError

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [[0.0] for _ in texts]

    @abstractmethod
    async def health_check(self) -> dict[str, Any]:
        raise NotImplementedError
