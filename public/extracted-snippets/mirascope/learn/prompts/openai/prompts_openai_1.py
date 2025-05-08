#!/usr/bin/env python3
# Example 1: Prompt Templates (Messages)
# Generated for provider: openai
# Source: content/docs/mirascope/learn/prompts.mdx:31
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template() # [!code highlight]
def recommend_book_prompt(genre: str) -> str: # [!code highlight]
    return f"Recommend a {genre} book" # [!code highlight]


print(recommend_book_prompt("fantasy"))
# Output: [BaseMessageParam(role='user', content='Recommend a fantasy book')] # [!code highlight]
