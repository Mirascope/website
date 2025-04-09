#!/usr/bin/env python3
# Example 1: Function Chaining
# Generated for provider: openai
# Source: src/docs/mirascope/learn/chaining.mdx:27
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini")
def summarize(text: str) -> str:
    return f"Summarize this text: {text}"


@llm.call(provider="openai", model="gpt-4o-mini")
def translate(text: str, language: str) -> str:
    return f"Translate this text to {language}: {text}"


summary = summarize("Long English text here...")
translation = translate(summary.content, "french")
print(translation.content)
