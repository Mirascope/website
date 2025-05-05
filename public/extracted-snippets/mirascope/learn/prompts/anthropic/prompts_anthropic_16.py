#!/usr/bin/env python3
# Example 16: Chat History
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/prompts.mdx:534
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseMessageParam, Messages, prompt_template


@prompt_template()
def chatbot(query: str, history: list[BaseMessageParam]) -> list[BaseMessageParam]:
    return [Messages.System("You are a librarian"), *history, Messages.User(query)] # [!code highlight]


history = [
    Messages.User("Recommend a book"),
    Messages.Assistant("What genre do you like?"),
]
print(chatbot("fantasy", history))
# Output: [
#     BaseMessageParam(role="system", content="You are a librarian"), # [!code highlight]
#     BaseMessageParam(role="user", content="Recommend a book"), # [!code highlight]
#     BaseMessageParam(role="assistant", content="What genre do you like?"), # [!code highlight]
#     BaseMessageParam(role="user", content="fantasy"), # [!code highlight]
# ]
