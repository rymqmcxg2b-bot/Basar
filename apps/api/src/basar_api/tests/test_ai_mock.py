# SPDX-License-Identifier: Apache-2.0

import pytest
from basar_api.providers.ai_mock import MockAIProvider


@pytest.mark.asyncio
async def test_mock_ai_returns_citations() -> None:
    text = await MockAIProvider().generate("What?", [{"id": "src_1"}], {})
    assert "src_1" in text
