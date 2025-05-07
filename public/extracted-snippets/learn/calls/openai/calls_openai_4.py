#!/usr/bin/env python3
# Example 4: Runtime Provider Overrides
# Generated for provider: openai
# Source: content/docs/mirascope/learn/calls.mdx:107
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from mirascope.core import prompt_template


@llm.call(provider="openai", model="gpt-4o-mini") # [!code highlight]
@prompt_template("Recommend a {genre} book") # [!code highlight]
def recommend_book(genre: str): ... # [!code highlight]


response = recommend_book("fantasy")
print(response.content)

override_response = llm.override( # [!code highlight]
    recommend_book, # [!code highlight]
    provider="anthropic", # [!code highlight]
    model="claude-3-5-sonnet-latest", # [!code highlight]
    call_params={"temperature": 0.7}, # [!code highlight]
)("fantasy") # [!code highlight]

print(override_response.content)
