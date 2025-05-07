#!/usr/bin/env python3
# Example 5: Multi-Line Prompts
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/prompts.mdx:139
# This file is auto-generated; any edits should be made in the source file

import inspect
from mirascope import prompt_template


@prompt_template()
def recommend_book_prompt(genre: str) -> str:
    return inspect.cleandoc(
        f"""
        Recommend a {genre} book. # [!code highlight]
        Output in the format Title by Author. # [!code highlight]
        """
    )


print(recommend_book_prompt("fantasy"))
# Output: [BaseMessageParam(role='user', content='Recommend a fantasy book.\nOutput in the format Title by Author.')] # [!code highlight]
