#!/usr/bin/env python3
# Example 2: Function Chaining
# Generated for provider: openai
# This file is auto-generated and should not be edited directly

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Summarize this text: {text}")
def summarize(text: str): ...


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Translate this text to {language}: {text}")
def translate(text: str, language: str): ...


summary = summarize("Long English text here...")
translation = translate(summary.content, "french")
print(translation.content)
