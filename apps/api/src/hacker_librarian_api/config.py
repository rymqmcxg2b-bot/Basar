# SPDX-License-Identifier: Apache-2.0

from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_path: str = Field(default="data/hacker_librarian.sqlite")
    archive_dir: str = Field(default="data/archive")
    ai_provider: str = Field(default="mock")
    openai_compatible_base_url: str | None = None
    openai_compatible_api_key: str | None = None
    ollama_base_url: str = "http://localhost:11434"
    zerog_dry_run: bool = True
    zerog_storage_endpoint: str | None = None
    zerog_compute_endpoint: str | None = None
    zerog_wallet_address: str | None = None

    @property
    def database_file(self) -> Path:
        return Path(self.database_path)

    @property
    def archive_path(self) -> Path:
        return Path(self.archive_dir)


@lru_cache
def get_settings() -> Settings:
    return Settings()
