#!/usr/bin/env python3
# Example 3: Nested Chains
# Generated for provider: openai
# Source: content/docs/mirascope/learn/chaining.mdx:77
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini")
def summarize(text: str) -> str: # [!code highlight]
    return f"Summarize this text: {text}"


@llm.call(provider="openai", model="gpt-4o-mini")
def summarize_and_translate(text: str, language: str) -> str:
    summary = summarize(text) # [!code highlight]
    return f"Translate this text to {language}: {summary.content}" # [!code highlight]


response = summarize_and_translate("Long English text here...", "french")
print(response.content) # [!code highlight]
