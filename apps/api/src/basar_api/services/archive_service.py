# SPDX-License-Identifier: Apache-2.0

from basar_api.config import Settings
from basar_api.providers.storage_0g import ZeroGStorageProvider


def archive_source_to_0g(settings: Settings, source_card: dict, dry_run: bool = True) -> dict:
    original = settings.zerog_dry_run
    settings.zerog_dry_run = dry_run
    try:
        provider = ZeroGStorageProvider(settings)
        uri = provider.put_json(source_card, {"source_id": source_card["id"]})
    finally:
        settings.zerog_dry_run = original
    return {"source_id": source_card["id"], "archived_uri": uri, "dry_run": dry_run}
