#!/usr/bin/env python3
# Example 22: Tool Message Parameters
# Generated for provider: openai
# Source: content/docs/mirascope/learn/tools.mdx:1040
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseDynamicConfig, BaseMessageParam, BaseTool, llm, prompt_template


class GetBookAuthor(BaseTool):
    title: str

    def call(self) -> str:
        if self.title == "The Name of the Wind":
            return "Patrick Rothfuss"
        elif self.title == "Mistborn: The Final Empire":
            return "Brandon Sanderson"
        else:
            return "Unknown"


@llm.call(provider="openai", model="gpt-4o-mini", tools=[GetBookAuthor])
@prompt_template(
    """
    MESSAGES: {history} # [!code highlight]
    USER: {query}
    """
)
def identify_author(book: str, history: list[BaseMessageParam]) -> BaseDynamicConfig:
    return {"computed_fields": {"query": f"Who wrote {book}" if book else ""}} # [!code highlight]


history = []
response = identify_author("The Name of the Wind", history)
history += [response.user_message_param, response.message_param]
while tool := response.tool:
    tools_and_outputs = [(tool, tool.call())]
    history += response.tool_message_params(tools_and_outputs)
    response = identify_author("", history) # [!code highlight]
    history.append(response.message_param) # [!code highlight]
print(response.content) # [!code highlight]
# Output: The Name of the Wind was written by Patrick Rothfuss.
