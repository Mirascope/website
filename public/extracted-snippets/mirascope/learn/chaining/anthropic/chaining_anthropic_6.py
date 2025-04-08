#!/usr/bin/env python3
# Example 6: This will contain the `summarize` response
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import BaseDynamicConfig, llm, prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Summarize this text: {text}")
def summarize(text: str): ...


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Translate this text to {language}: {summary}")
def summarize_and_translate(text: str, language: str) -> BaseDynamicConfig:
    return {"computed_fields": {"summary": summarize(text)}}


response = summarize_and_translate("Long English text here...", "french")
print(response.content)
print(
    response.model_dump()["computed_fields"]
)  # This will contain the `summarize` response
