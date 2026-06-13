# SPDX-License-Identifier: Apache-2.0

from abc import ABC, abstractmethod
from typing import Any


class StorageProvider(ABC):
    @abstractmethod
    def put_file(self, path: str, metadata: dict[str, Any] | None = None) -> str:
        raise NotImplementedError

    @abstractmethod
    def get_file(self, uri: str) -> bytes:
        raise NotImplementedError

    @abstractmethod
    def put_json(self, obj: dict[str, Any], metadata: dict[str, Any] | None = None) -> str:
        raise NotImplementedError

    @abstractmethod
    def health_check(self) -> dict[str, Any]:
        raise NotImplementedError
