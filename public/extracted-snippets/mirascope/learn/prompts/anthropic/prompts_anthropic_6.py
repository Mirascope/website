#!/usr/bin/env python3
# Example 6: Multi-Line Prompts
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/prompts.mdx:151
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template(
    """
    USER:
    Recommend a {genre} book.
    Output in the format Title by Author.
    """
)
def recommend_book_prompt(genre: str): ...


print(recommend_book_prompt("fantasy"))
# Output: [BaseMessageParam(role='user', content='Recommend a fantasy book.\nOutput in the format Title by Author.')]
