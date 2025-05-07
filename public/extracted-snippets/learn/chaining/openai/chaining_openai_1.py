#!/usr/bin/env python3
# Example 1: Function Chaining
# Generated for provider: openai
# Source: content/docs/mirascope/learn/chaining.mdx:28
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini")
def summarize(text: str) -> str: # [!code highlight]
    return f"Summarize this text: {text}"


@llm.call(provider="openai", model="gpt-4o-mini")
def translate(text: str, language: str) -> str: # [!code highlight]
    return f"Translate this text to {language}: {text}"


summary = summarize("Long English text here...") # [!code highlight]
translation = translate(summary.content, "french") # [!code highlight]
print(translation.content)
