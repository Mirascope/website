#!/usr/bin/env python3
# Example 2: Basic Usage and Syntax
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/output_parsers.mdx:45
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template


def parse_recommendation(response: llm.CallResponse) -> tuple[str, str]:
    title, author = response.content.split(" by ")
    return (title, author)


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", output_parser=parse_recommendation) # [!code highlight]
@prompt_template("Recommend a {genre} book. Output only Title by Author")
def recommend_book(genre: str): ...


print(recommend_book("fantasy"))
# Output: ('"The Name of the Wind"', 'Patrick Rothfuss') # [!code highlight]
