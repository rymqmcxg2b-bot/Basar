# SPDX-License-Identifier: Apache-2.0

from fastapi import APIRouter
from basar_api.db import connect, export_library

router = APIRouter()


@router.post("/export")
def export_route() -> dict:
    with connect() as conn:
        return export_library(conn)
