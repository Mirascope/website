#!/usr/bin/env python3
# Example 4: Functional, Modular Design
# Generated for provider: anthropic
# Source: content/docs/mirascope/getting-started/why.mdx:141
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def summarize(text: str) -> str: # [!code highlight]
    return f"Summarize this text: {text}"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def summarize_and_translate(text: str, language: str) -> str:
    summary = summarize(text) # [!code highlight]
    return f"Translate this text to {language}: {summary.content}" # [!code highlight]


response = summarize_and_translate("Long English text here...", "french") # [!code highlight]
print(response.content)
