#!/usr/bin/env python3
# Example 2: Function Chaining
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/chaining.mdx:48
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Summarize this text: {text}")
def summarize(text: str): ...


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Translate this text to {language}: {text}")
def translate(text: str, language: str): ...


summary = summarize("Long English text here...")
translation = translate(summary.content, "french")
print(translation.content)
