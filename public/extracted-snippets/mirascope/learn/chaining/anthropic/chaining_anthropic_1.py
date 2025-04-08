#!/usr/bin/env python3
# Example 1: Function Chaining
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def summarize(text: str) -> str:
    return f"Summarize this text: {text}"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def translate(text: str, language: str) -> str:
    return f"Translate this text to {language}: {text}"


summary = summarize("Long English text here...")
translation = translate(summary.content, "french")
print(translation.content)
