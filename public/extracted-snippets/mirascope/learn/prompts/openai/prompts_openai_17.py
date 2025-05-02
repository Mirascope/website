#!/usr/bin/env python3
# Example 17: Chat History
# Generated for provider: openai
# Source: content/doc/mirascope/learn/prompts.mdx:557
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseMessageParam, Messages, prompt_template


@prompt_template(
    """
    SYSTEM: You are a librarian # [!code highlight]
    MESSAGES: {history} # [!code highlight]
    USER: {query} # [!code highlight]
    """
)
def chatbot(query: str, history: list[BaseMessageParam]): ...


history = [
    Messages.User("Recommend a book"), # [!code highlight]
    Messages.Assistant("What genre do you like?"), # [!code highlight]
]
print(chatbot("fantasy", history))
# Output: [
#     BaseMessageParam(role="system", content="You are a librarian"), # [!code highlight]
#     BaseMessageParam(role="user", content="Recommend a book"), # [!code highlight]
#     BaseMessageParam(role="assistant", content="What genre do you like?"), # [!code highlight]
#     BaseMessageParam(role="user", content="fantasy"), # [!code highlight]
# ]
