#!/usr/bin/env python3
# Example 1: Prompt Templates (Messages)
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import prompt_template


@prompt_template()
def recommend_book_prompt(genre: str) -> str:
    return f"Recommend a {genre} book"


print(recommend_book_prompt("fantasy"))
# Output: [BaseMessageParam(role='user', content='Recommend a fantasy book')]
