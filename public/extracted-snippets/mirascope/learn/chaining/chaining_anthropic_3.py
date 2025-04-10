#!/usr/bin/env python3
# Example 3: Nested Chains
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/chaining.mdx:76
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def summarize(text: str) -> str:
    return f"Summarize this text: {text}"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def summarize_and_translate(text: str, language: str) -> str:
    summary = summarize(text)
    return f"Translate this text to {language}: {summary.content}"


response = summarize_and_translate("Long English text here...", "french")
print(response.content)
