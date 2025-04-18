#!/usr/bin/env python3
# Example 17: Chat History
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/prompts.mdx:557
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseMessageParam, Messages, prompt_template


@prompt_template(
    """
    SYSTEM: You are a librarian
    MESSAGES: {history}
    USER: {query}
    """
)
def chatbot(query: str, history: list[BaseMessageParam]): ...


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
