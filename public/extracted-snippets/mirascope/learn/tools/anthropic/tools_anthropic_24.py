#!/usr/bin/env python3
# Example 24: Tool Message Parameters
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/tools.mdx:1120
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseMessageParam, BaseDynamicConfig, llm, prompt_template


def get_book_author(title: str) -> str:
    if title == "The Name of the Wind":
        return "Patrick Rothfuss"
    elif title == "Mistborn: The Final Empire":
        return "Brandon Sanderson"
    else:
        return "Unknown"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[get_book_author])
@prompt_template(
    """
    MESSAGES: {history}
    USER: {query}
    """
)
def identify_author(book: str, history: list[BaseMessageParam]) -> BaseDynamicConfig:
    return {"computed_fields": {"query": f"Who wrote {book}" if book else ""}}


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
