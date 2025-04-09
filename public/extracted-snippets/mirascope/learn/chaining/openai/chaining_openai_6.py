#!/usr/bin/env python3
# Example 6: Nested Chains
# Generated for provider: openai
# Source: src/docs/mirascope/learn/chaining.mdx:152
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseDynamicConfig, llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Summarize this text: {text}")
def summarize(text: str): ...


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Translate this text to {language}: {summary}")
def summarize_and_translate(text: str, language: str) -> BaseDynamicConfig:
    return {"computed_fields": {"summary": summarize(text)}}


response = summarize_and_translate("Long English text here...", "french")
print(response.content)
print(
    response.model_dump()["computed_fields"]
)  # This will contain the `summarize` response
