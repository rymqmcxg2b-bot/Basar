# SPDX-License-Identifier: Apache-2.0

import re

from hacker_librarian_api.db import search_sources


def retrieve(conn, question: str, limit: int = 5) -> list[dict]:
    tokens = re.findall(r"[A-Za-z0-9_]+", question)
    terms = " OR ".join(token for token in tokens if len(token) > 2)
    query = terms or question
    results = search_sources(conn, query, limit=limit)
    return sorted(results, key=lambda c: c.get("quality", {}).get("score", 0), reverse=True)
