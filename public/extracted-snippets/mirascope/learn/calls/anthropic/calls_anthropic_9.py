#!/usr/bin/env python3
# Example 9: Metadata
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/calls.mdx:372
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseDynamicConfig, Messages, llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def recommend_book(genre: str) -> BaseDynamicConfig:
    return {
        "messages": [Messages.User(f"Recommend a {genre} book")],
        "call_params": {"max_tokens": 512},
        "metadata": {"tags": {"version:0001"}},
    }


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
