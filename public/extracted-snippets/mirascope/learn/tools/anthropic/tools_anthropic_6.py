#!/usr/bin/env python3
# Example 6: Accessing Original Tool Call
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/tools.mdx:257
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseTool, llm, prompt_template
from pydantic import Field


class GetBookAuthor(BaseTool):
    """Returns the author of the book with the given title."""

    title: str = Field(..., description="The title of the book.")

    def call(self) -> str:
        if self.title == "The Name of the Wind":
            return "Patrick Rothfuss"
        elif self.title == "Mistborn: The Final Empire":
            return "Brandon Sanderson"
        else:
            return "Unknown"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[GetBookAuthor])
@prompt_template("Who wrote {book}?")
def identify_author(book: str): ...


response = identify_author("The Name of the Wind")
if tool := response.tool:
    print(tool.call())
    # Output: Patrick Rothfuss
    print(f"Original tool call: {tool.tool_call}")
else:
    print(response.content)
