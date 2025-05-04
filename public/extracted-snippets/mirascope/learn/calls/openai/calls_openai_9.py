#!/usr/bin/env python3
# Example 9: Metadata
# Generated for provider: openai
# Source: content/doc/mirascope/learn/calls.mdx:373
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseDynamicConfig, Messages, llm


@llm.call(provider="openai", model="gpt-4o-mini")
def recommend_book(genre: str) -> BaseDynamicConfig:
    return {
        "messages": [Messages.User(f"Recommend a {genre} book")], # [!code highlight]
        "call_params": {"max_tokens": 512},
        "metadata": {"tags": {"version:0001"}}, # [!code highlight]
    }


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
