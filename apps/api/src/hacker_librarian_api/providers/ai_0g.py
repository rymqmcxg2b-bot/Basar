# SPDX-License-Identifier: Apache-2.0

from typing import Any
from hacker_librarian_api.config import Settings
from hacker_librarian_api.providers.ai_base import AIProvider


class ZeroGComputeProvider(AIProvider):
    """0G Compute scaffold.

    TODO: Verify current official 0G Compute SDK/API details before replacing dry-run
    behavior. Keep credentials in environment variables and never log secrets.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    async def generate(self, prompt: str, context: list[dict[str, Any]], settings: dict[str, Any] | None = None) -> str:
        if self.settings.zerog_dry_run:
            return "0G dry-run compute response. Verify official 0G SDK/API before production use."
        if not self.settings.zerog_compute_endpoint:
            raise RuntimeError("0G Compute endpoint is not configured.")
        raise NotImplementedError("TODO: implement against verified official 0G Compute SDK/API.")

    async def health_check(self) -> dict[str, Any]:
        return {"provider": "0g-compute", "dry_run": self.settings.zerog_dry_run, "configured": bool(self.settings.zerog_compute_endpoint)}
