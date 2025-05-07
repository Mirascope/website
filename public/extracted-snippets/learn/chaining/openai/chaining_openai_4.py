#!/usr/bin/env python3
# Example 4: Nested Chains
# Generated for provider: openai
# Source: content/docs/mirascope/learn/chaining.mdx:97
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseDynamicConfig, llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Summarize this text: {text}")
def summarize(text: str): ... # [!code highlight]


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Translate this text to {language}: {summary}") # [!code highlight]
def summarize_and_translate(text: str, language: str) -> BaseDynamicConfig:
    return {"computed_fields": {"summary": summarize(text)}} # [!code highlight]


response = summarize_and_translate("Long English text here...", "french")
print(response.content) # [!code highlight]
