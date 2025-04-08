#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import llm


def parse_recommendation(response: llm.CallResponse) -> tuple[str, str]:
    title, author = response.content.split(" by ")
    return (title, author)


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", output_parser=parse_recommendation)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book. Output only Title by Author"


print(recommend_book("fantasy"))
# Output: ('"The Name of the Wind"', 'Patrick Rothfuss')
