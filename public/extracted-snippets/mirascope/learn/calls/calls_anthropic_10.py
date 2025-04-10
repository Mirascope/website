#!/usr/bin/env python3
# Example 10: Metadata
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/calls.mdx:390
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseDynamicConfig, llm, prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str) -> BaseDynamicConfig:
    return {
        "call_params": {"max_tokens": 512},
        "metadata": {"tags": {"version:0001"}},
    }


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
