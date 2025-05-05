#!/usr/bin/env python3
# Example 6: Multi-Line Prompts
# Generated for provider: openai
# Source: content/doc/mirascope/learn/prompts.mdx:152
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template(
    """
    Recommend a {genre} book. # [!code highlight]
    Output in the format Title by Author. # [!code highlight]
    """
)
def recommend_book_prompt(genre: str): ...


print(recommend_book_prompt("fantasy"))
# Output: [BaseMessageParam(role='user', content='Recommend a fantasy book.\nOutput in the format Title by Author.')] # [!code highlight]
