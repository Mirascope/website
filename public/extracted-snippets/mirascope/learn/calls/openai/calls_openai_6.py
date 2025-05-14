#!/usr/bin/env python3
# Example 6: Common Parameters Across Providers
# Generated for provider: openai
# Source: content/docs/mirascope/learn/calls.mdx:249
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini", call_params={"max_tokens": 512}) # [!code highlight]
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
