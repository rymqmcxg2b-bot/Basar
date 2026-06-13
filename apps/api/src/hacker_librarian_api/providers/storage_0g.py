# SPDX-License-Identifier: Apache-2.0

from typing import Any
from hacker_librarian_api.config import Settings
from hacker_librarian_api.providers.storage_base import StorageProvider


class ZeroGStorageProvider(StorageProvider):
    """0G Storage scaffold.

    TODO: Verify current official 0G Storage SDK/API calls before production use.
    This class is intentionally dry-run friendly and must never log private keys.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    def put_file(self, path: str, metadata: dict[str, Any] | None = None) -> str:
        if self.settings.zerog_dry_run:
            return f"0g://dry-run/{metadata.get('source_id', 'file') if metadata else 'file'}"
        if not self.settings.zerog_storage_endpoint:
            raise RuntimeError("0G Storage endpoint is not configured.")
        raise NotImplementedError("TODO: implement against verified official 0G Storage SDK/API.")

    def get_file(self, uri: str) -> bytes:
        if self.settings.zerog_dry_run:
            return b""
        raise NotImplementedError("TODO: implement against verified official 0G Storage SDK/API.")

    def put_json(self, obj: dict[str, Any], metadata: dict[str, Any] | None = None) -> str:
        if self.settings.zerog_dry_run:
            return f"0g://dry-run/{metadata.get('source_id', 'json') if metadata else 'json'}"
        raise NotImplementedError("TODO: implement against verified official 0G Storage SDK/API.")

    def health_check(self) -> dict[str, Any]:
        return {"provider": "0g-storage", "dry_run": self.settings.zerog_dry_run, "configured": bool(self.settings.zerog_storage_endpoint)}
