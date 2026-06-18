# SPDX-License-Identifier: Apache-2.0

from basar_api.config import Settings
from basar_api.providers.ai_0g import ZeroGComputeProvider
from basar_api.providers.ai_mock import MockAIProvider
from basar_api.providers.ai_ollama import OllamaProvider
from basar_api.providers.ai_openai_compatible import OpenAICompatibleProvider


def get_ai_provider(settings: Settings):
    if settings.ai_provider == "ollama":
        return OllamaProvider(settings)
    if settings.ai_provider == "openai-compatible":
        return OpenAICompatibleProvider(settings)
    if settings.ai_provider == "0g":
        return ZeroGComputeProvider(settings)
    return MockAIProvider()
