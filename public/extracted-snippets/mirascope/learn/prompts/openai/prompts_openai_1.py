#!/usr/bin/env python3
# Example 1: Prompt Templates (Messages)
# Generated for provider: openai
# Source: src/docs/mirascope/learn/prompts.mdx:23
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template()
def recommend_book_prompt(genre: str) -> str:
    return f"Recommend a {genre} book"


print(recommend_book_prompt("fantasy"))
# Output: [BaseMessageParam(role='user', content='Recommend a fantasy book')]
