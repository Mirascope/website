#!/usr/bin/env python3
# Example 2: Basic Usage and Syntax
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/calls.mdx:44
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest") # [!code highlight]
@prompt_template("Recommend a {genre} book") # [!code highlight]
def recommend_book(genre: str): ...


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
