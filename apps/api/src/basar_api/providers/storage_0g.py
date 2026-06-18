# SPDX-License-Identifier: Apache-2.0

from pathlib import Path
from typing import Any

import httpx

from basar_api.config import Settings
from basar_api.providers.storage_base import StorageProvider


class ZeroGStorageProvider(StorageProvider):
    """0G Storage production/REST scaffold.

    Uses environment-configured endpoint + credentials. Endpoint shapes are
    intentionally tolerant so teams can route through a gateway or proxy that
    conforms to one of these patterns:
    - POST {endpoint}/upload
    - POST {endpoint}/objects or {endpoint}/api/v1/objects
    For retrieval, this provider currently supports URIs returned by the upload path.
    """

    def __init__(self, settings: Settings):
        self.settings = settings

    def _headers(self, content_type: str | None = "application/json") -> dict[str, str]:
        headers = {"User-Agent": "basar/0g-storage"}
        if content_type:
            headers["Content-Type"] = content_type
        if self.settings.zerog_api_key:
            if self.settings.zerog_storage_bearer_auth:
                headers["Authorization"] = f"Bearer {self.settings.zerog_api_key}"
            else:
                headers["x-api-key"] = self.settings.zerog_api_key
        return headers

    def _post_json(self, payload: dict[str, Any], endpoint_variants: list[str]) -> dict[str, Any]:
        timeout = self.settings.zerog_request_timeout_seconds
        last_error: Exception | None = None
        with httpx.Client(timeout=timeout) as client:
            for endpoint in endpoint_variants:
                try:
                    response = client.post(endpoint, json=payload, headers=self._headers())
                    response.raise_for_status()
                    if response.text:
                        return response.json()
                    return {}
                except Exception as exc:
                    last_error = exc
                    continue
        if last_error:
            raise RuntimeError(f"0G storage upload failed: {last_error}")
        raise RuntimeError("0G storage upload failed: no endpoint available")

    def _post_file(self, file_path: str, endpoint_variants: list[str]) -> dict[str, Any]:
        timeout = self.settings.zerog_request_timeout_seconds
        if not self.settings.zerog_dry_run:
            with httpx.Client(timeout=timeout) as client:
                last_error: Exception | None = None
                with open(file_path, "rb") as fh:
                    files = {"file": fh}
                    for endpoint in endpoint_variants:
                        try:
                            response = client.post(endpoint, files=files, headers=self._headers(content_type=None))
                            response.raise_for_status()
                            return response.json()
                        except Exception as exc:
                            last_error = exc
                            continue
                if last_error:
                    raise RuntimeError(f"0G storage file upload failed: {last_error}")
        return {"uri": f"0g://{Path(file_path).name}"}

    def _normalize_uri(self, result: dict[str, Any], fallback: str) -> str:
        for key in ("uri", "rootHash", "root_hash", "hash", "id", "ref", "reference", "url", "location", "path"):
            value = result.get(key)
            if value:
                return str(value)
        return fallback

    def put_file(self, path: str, metadata: dict[str, Any] | None = None) -> str:
        if self.settings.zerog_dry_run:
            return f"0g://dry-run/{metadata.get('source_id', 'file') if metadata else 'file'}"
        if not self.settings.zerog_storage_endpoint:
            raise RuntimeError("0G Storage endpoint is not configured.")
        endpoint = self.settings.zerog_storage_endpoint.rstrip("/")
        response = self._post_file(
            path,
            [
                f"{endpoint}/upload",
                f"{endpoint}/objects",
                f"{endpoint}/api/v1/objects",
            ],
        )
        return self._normalize_uri(response if isinstance(response, dict) else {}, f"0g://{Path(path).name}")

    def get_file(self, uri: str) -> bytes:
        if self.settings.zerog_dry_run:
            return b""
        if not self.settings.zerog_storage_endpoint:
            raise RuntimeError("0G Storage endpoint is not configured.")
        base = self.settings.zerog_storage_endpoint.rstrip("/")
        if uri.startswith("0g://"):
            uri = uri.replace("0g://", "")
        with httpx.Client(timeout=self.settings.zerog_request_timeout_seconds) as client:
            response = client.get(f"{base}/download/{uri}", headers=self._headers())
            response.raise_for_status()
            return response.content

    def put_json(self, obj: dict[str, Any], metadata: dict[str, Any] | None = None) -> str:
        if self.settings.zerog_dry_run:
            return f"0g://dry-run/{metadata.get('source_id', 'json') if metadata else 'json'}"
        if not self.settings.zerog_storage_endpoint:
            raise RuntimeError("0G Storage endpoint is not configured.")
        endpoint = self.settings.zerog_storage_endpoint.rstrip("/")
        response = self._post_json(
            {"type": "json", "payload": obj, "metadata": metadata or {}},
            [
                f"{endpoint}/store",
                f"{endpoint}/objects",
                f"{endpoint}/api/v1/objects",
            ],
        )
        return self._normalize_uri(response if isinstance(response, dict) else {}, "0g://json")

    def health_check(self) -> dict[str, Any]:
        return {
            "provider": "0g-storage",
            "dry_run": self.settings.zerog_dry_run,
            "configured": bool(self.zerog_storage_endpoint),
            "storage_endpoint": self.settings.zerog_storage_endpoint,
        }

    @property
    def zerog_storage_endpoint(self) -> str | None:
        return self.settings.zerog_storage_endpoint
