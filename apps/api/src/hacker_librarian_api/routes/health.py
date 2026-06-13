# SPDX-License-Identifier: Apache-2.0

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health() -> dict:
    return {"ok": True, "service": "hacker-librarian-api"}
