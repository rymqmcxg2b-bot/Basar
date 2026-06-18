# SPDX-License-Identifier: Apache-2.0

from basar_api.config import Settings
from basar_api.providers.storage_0g import ZeroGStorageProvider
from basar_api.providers.storage_local import LocalStorageProvider
from basar_api.services.archive_service import archive_source_to_0g


def test_local_storage_provider(tmp_path) -> None:
    source = tmp_path / "source.txt"
    source.write_text("public domain sample", encoding="utf-8")
    provider = LocalStorageProvider(str(tmp_path / "archive"))
    uri = provider.put_file(str(source), {})
    assert provider.get_file(uri) == b"public domain sample"


def test_0g_dry_run_without_credentials() -> None:
    provider = ZeroGStorageProvider(Settings(zerog_dry_run=True))
    assert provider.put_json({"ok": True}, {"source_id": "src"}) == "0g://dry-run/src"


def test_archive_service_restores_dry_run_after_failed_execute() -> None:
    settings = Settings(zerog_dry_run=True, zerog_storage_endpoint=None)

    try:
        archive_source_to_0g(settings, {"id": "src"}, dry_run=False)
    except RuntimeError as exc:
        assert "0G Storage endpoint is not configured" in str(exc)
    else:
        raise AssertionError("Expected missing 0G endpoint to fail")

    assert settings.zerog_dry_run is True
