#!/usr/bin/env python3
# Example 8: Call Params
# Generated for provider: openai
# Source: content/doc/mirascope/learn/calls.mdx:350
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseDynamicConfig, llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Recommend a {genre} book") # [!code highlight]
def recommend_book(genre: str) -> BaseDynamicConfig:
    return {
        "call_params": {"max_tokens": 512}, # [!code highlight]
        "metadata": {"tags": {"version:0001"}},
    }


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
