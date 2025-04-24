#!/usr/bin/env python3
# Example 17: Streaming Partial Tools
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/tools.mdx:823
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseTool, llm
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


@llm.call(
    provider="anthropic",
    model="claude-3-5-sonnet-latest",
    tools=[GetBookAuthor],
    stream={"partial_tools": True},
)
def identify_authors(books: list[str]) -> str:
    return f"Who wrote {books}?"


stream = identify_authors(["The Name of the Wind", "Mistborn: The Final Empire"])
for chunk, tool in stream:
    if tool:
        if tool.delta is not None:  # partial tool
            print(tool.delta)
        else:
            print(tool.call())
    else:
        print(chunk.content, end="", flush=True)
