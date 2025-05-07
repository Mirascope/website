#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/docs/mirascope/learn/output_parsers.mdx:26
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


def parse_recommendation(response: llm.CallResponse) -> tuple[str, str]:
    title, author = response.content.split(" by ")
    return (title, author)


@llm.call(provider="openai", model="gpt-4o-mini", output_parser=parse_recommendation) # [!code highlight]
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book. Output only Title by Author"


print(recommend_book("fantasy"))
# Output: ('"The Name of the Wind"', 'Patrick Rothfuss') # [!code highlight]
