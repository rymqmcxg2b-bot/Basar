# SPDX-License-Identifier: Apache-2.0

import json
import shutil
import uuid
from pathlib import Path
from typing import Any
from hacker_librarian_api.providers.storage_base import StorageProvider


class LocalStorageProvider(StorageProvider):
    def __init__(self, archive_dir: str):
        self.archive_dir = Path(archive_dir)
        self.archive_dir.mkdir(parents=True, exist_ok=True)

    def put_file(self, path: str, metadata: dict[str, Any] | None = None) -> str:
        source = Path(path)
        dest = self.archive_dir / f"{uuid.uuid4().hex}-{source.name}"
        shutil.copyfile(source, dest)
        return str(dest)

    def get_file(self, uri: str) -> bytes:
        return Path(uri).read_bytes()

    def put_json(self, obj: dict[str, Any], metadata: dict[str, Any] | None = None) -> str:
        dest = self.archive_dir / f"{uuid.uuid4().hex}.json"
        dest.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
        return str(dest)

    def health_check(self) -> dict[str, Any]:
        return {"provider": "local", "ok": self.archive_dir.exists(), "archive_dir": str(self.archive_dir)}
