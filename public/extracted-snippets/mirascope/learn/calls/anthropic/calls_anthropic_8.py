#!/usr/bin/env python3
# Example 8: Call Params
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

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
