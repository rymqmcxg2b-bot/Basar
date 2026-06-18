# SPDX-License-Identifier: Apache-2.0

from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_path: str = Field(default="data/basar.sqlite")
    archive_dir: str = Field(default="data/archive")
    cors_allow_origins: str = Field(default="*")
    ai_provider: str = Field(default="mock")
    openai_compatible_base_url: str | None = None
    openai_compatible_api_key: str | None = None
    ollama_base_url: str = "http://localhost:11434"
    zerog_dry_run: bool = True
    zerog_api_key: str | None = None
    zerog_storage_endpoint: str | None = None
    zerog_compute_endpoint: str | None = "https://router-api.0g.ai/v1"
    zerog_compute_model: str | None = None
    zerog_wallet_address: str | None = None
    zerog_request_timeout_seconds: int = 30
    zerog_storage_bearer_auth: bool = True
    zerog_compute_task: str = "answer_question"

    @property
    def database_file(self) -> Path:
        return Path(self.database_path)

    @property
    def archive_path(self) -> Path:
        return Path(self.archive_dir)

    @property
    def cors_origins(self) -> list[str]:
        values = [origin.strip() for origin in self.cors_allow_origins.split(",") if origin.strip()]
        return values or ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
