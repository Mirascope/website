#!/usr/bin/env python3
# Example 14: Streaming Tools
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/tools.mdx:698
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


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[GetBookAuthor], stream=True) # [!code highlight]
@prompt_template("Who wrote {books}?")
def identify_authors(books: list[str]): ...


stream = identify_authors(["The Name of the Wind", "Mistborn: The Final Empire"])
for chunk, tool in stream: # [!code highlight]
    if tool: # [!code highlight]
        print(tool.call()) # [!code highlight]
    else:
        print(chunk.content, end="", flush=True)
