#!/usr/bin/env python3
# Example 16: Chat History
# Generated for provider: openai
# Source: src/docs/mirascope/learn/prompts.mdx:534
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseMessageParam, Messages, prompt_template


@prompt_template()
def chatbot(query: str, history: list[BaseMessageParam]) -> list[BaseMessageParam]:
    return [Messages.System("You are a librarian"), *history, Messages.User(query)]


history = [
    Messages.User("Recommend a book"),
    Messages.Assistant("What genre do you like?"),
]
print(chatbot("fantasy", history))
# Output: [
#     BaseMessageParam(role="system", content="You are a librarian"),
#     BaseMessageParam(role="user", content="Recommend a book"),
#     BaseMessageParam(role="assistant", content="What genre do you like?"),
#     BaseMessageParam(role="user", content="fantasy"),
# ]
