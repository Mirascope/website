#!/usr/bin/env python3
# Example 5: Provider-Agnostic When Wanted, Specific When Needed
# Generated for provider: anthropic
# Source: content/docs/mirascope/getting-started/why.mdx:172
# This file is auto-generated; any edits should be made in the source file

from mirascope.core import anthropic, openai


@openai.call("gpt-4o-mini") # [!code highlight]
def openai_recommend_book(genre: str) -> str: # [!code highlight]
    return f"Recommend a {genre} book"


@anthropic.call("claude-3-5-sonnet-latest") # [!code highlight]
def anthropic_recommend_book(genre: str) -> str: # [!code highlight]
    return f"Recommend a {genre} book"


openai_response = openai_recommend_book("fantasy") # [!code highlight]
print(openai_response.content)

anthropic_response = anthropic_recommend_book("fantasy") # [!code highlight]
print(anthropic_response.content)
