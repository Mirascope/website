#!/usr/bin/env python3
# Example 10: Metadata
# Generated for provider: openai
# Source: content/docs/mirascope/learn/calls.mdx:333
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseDynamicConfig, llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Recommend a {genre} book") # [!code highlight]
def recommend_book(genre: str) -> BaseDynamicConfig:
    return {
        "call_params": {"max_tokens": 512},
        "metadata": {"tags": {"version:0001"}}, # [!code highlight]
    }


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
