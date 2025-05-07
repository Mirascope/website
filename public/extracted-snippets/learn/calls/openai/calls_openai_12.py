#!/usr/bin/env python3
# Example 12: Error Handling
# Generated for provider: openai
# Source: content/docs/mirascope/learn/calls.mdx:496
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


try:
    response: llm.CallResponse = recommend_book("fantasy") # [!code highlight]
    print(response.content)
except Exception as e:
    print(f"Error: {str(e)}") # [!code highlight]
