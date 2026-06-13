# SPDX-License-Identifier: Apache-2.0

from fastapi.testclient import TestClient
from hacker_librarian_api.main import app


def test_health() -> None:
    client = TestClient(app)
    assert client.get("/health").json()["ok"] is True
