#!/usr/bin/env python3
# Example 2: Prompt Templates (Messages)
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/prompts.mdx:37
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template("Recommend a {genre} book")
def recommend_book_prompt(genre: str): ...


print(recommend_book_prompt("fantasy"))
# Output: [BaseMessageParam(role='user', content='Recommend a fantasy book')]
