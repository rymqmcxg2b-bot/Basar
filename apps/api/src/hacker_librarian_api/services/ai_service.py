# SPDX-License-Identifier: Apache-2.0

from hacker_librarian_api.config import Settings
from hacker_librarian_api.providers.ai_0g import ZeroGComputeProvider
from hacker_librarian_api.providers.ai_mock import MockAIProvider
from hacker_librarian_api.providers.ai_ollama import OllamaProvider
from hacker_librarian_api.providers.ai_openai_compatible import OpenAICompatibleProvider


def get_ai_provider(settings: Settings):
    if settings.ai_provider == "ollama":
        return OllamaProvider(settings)
    if settings.ai_provider == "openai-compatible":
        return OpenAICompatibleProvider(settings)
    if settings.ai_provider == "0g":
        return ZeroGComputeProvider(settings)
    return MockAIProvider()
