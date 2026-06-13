# SPDX-License-Identifier: Apache-2.0

from hacker_librarian_api.config import Settings
from hacker_librarian_api.providers.storage_0g import ZeroGStorageProvider


def archive_source_to_0g(settings: Settings, source_card: dict, dry_run: bool = True) -> dict:
    original = settings.zerog_dry_run
    settings.zerog_dry_run = dry_run or original
    provider = ZeroGStorageProvider(settings)
    uri = provider.put_json(source_card, {"source_id": source_card["id"]})
    settings.zerog_dry_run = original
    return {"source_id": source_card["id"], "archived_uri": uri, "dry_run": dry_run}
