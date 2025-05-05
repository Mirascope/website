#!/usr/bin/env python3
# Example 2: Function Chaining
# Generated for provider: openai
# Source: content/doc/mirascope/learn/chaining.mdx:48
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Summarize this text: {text}")
def summarize(text: str): ... # [!code highlight]


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Translate this text to {language}: {text}")
def translate(text: str, language: str): ... # [!code highlight]


summary = summarize("Long English text here...") # [!code highlight]
translation = translate(summary.content, "french") # [!code highlight]
print(translation.content)
