# SPDX-License-Identifier: Apache-2.0

from hacker_librarian_api.config import Settings
from hacker_librarian_api.providers.storage_0g import ZeroGStorageProvider
from hacker_librarian_api.providers.storage_local import LocalStorageProvider


def test_local_storage_provider(tmp_path) -> None:
    source = tmp_path / "source.txt"
    source.write_text("public domain sample", encoding="utf-8")
    provider = LocalStorageProvider(str(tmp_path / "archive"))
    uri = provider.put_file(str(source), {})
    assert provider.get_file(uri) == b"public domain sample"


def test_0g_dry_run_without_credentials() -> None:
    provider = ZeroGStorageProvider(Settings(zerog_dry_run=True))
    assert provider.put_json({"ok": True}, {"source_id": "src"}) == "0g://dry-run/src"
