#!/usr/bin/env python3
# Example 3: Message Roles
# Generated for provider: openai
# Source: content/docs/mirascope/learn/prompts.mdx:74
# This file is auto-generated; any edits should be made in the source file

from mirascope import Messages, prompt_template


@prompt_template()
def recommend_book_prompt(genre: str) -> Messages.Type:
    return [
        Messages.System("You are a librarian"), # [!code highlight]
        Messages.User(f"Recommend a {genre} book"), # [!code highlight]
    ]


print(recommend_book_prompt("fantasy"))
# Output: [
#   BaseMessageParam(role='system', content='You are a librarian'), # [!code highlight]
#   BaseMessageParam(role='user', content='Recommend a fantasy book'), # [!code highlight]
# ]
