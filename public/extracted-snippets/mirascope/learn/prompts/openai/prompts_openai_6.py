#!/usr/bin/env python3
# Example 6: Output: [BaseMessageParam(role='user', content='Recommend a fantasy book.\nOutput in the format Title by Author.')]
# Generated for provider: openai
# This file is auto-generated and should not be edited directly

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
