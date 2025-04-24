#!/usr/bin/env python3
# Example 23: Tool Message Parameters
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/tools.mdx:1087
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseMessageParam, Messages, llm


def get_book_author(title: str) -> str:
    if title == "The Name of the Wind":
        return "Patrick Rothfuss"
    elif title == "Mistborn: The Final Empire":
        return "Brandon Sanderson"
    else:
        return "Unknown"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[get_book_author])
def identify_author(book: str, history: list[BaseMessageParam]) -> Messages.Type:
    messages = [*history]
    if book:
        messages.append(Messages.User(f"Who wrote {book}?"))
    return messages


history = []
response = identify_author("The Name of the Wind", history)
history += [response.user_message_param, response.message_param]
while tool := response.tool:
    tools_and_outputs = [(tool, tool.call())]
    history += response.tool_message_params(tools_and_outputs)
    response = identify_author("", history)
    history.append(response.message_param)
print(response.content)
# Output: The Name of the Wind was written by Patrick Rothfuss.
