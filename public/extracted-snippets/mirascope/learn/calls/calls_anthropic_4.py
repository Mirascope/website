#!/usr/bin/env python3
# Example 4: Runtime Provider Overrides
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/calls.mdx:108
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from mirascope.core import prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


response = recommend_book("fantasy")
print(response.content)

override_response = llm.override(
    recommend_book,
    provider="openai",
    model="gpt-4o-mini",
    call_params={"temperature": 0.7},
)("fantasy")

print(override_response.content)
