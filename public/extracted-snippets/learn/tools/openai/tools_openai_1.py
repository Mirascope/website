#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/docs/mirascope/learn/tools.mdx:52
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseTool, llm
from pydantic import Field

# [!code highlight:13]
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


@llm.call(provider="openai", model="gpt-4o-mini", tools=[GetBookAuthor]) # [!code highlight]
def identify_author(book: str) -> str:
    return f"Who wrote {book}?"


response = identify_author("The Name of the Wind")
if tool := response.tool: # [!code highlight]
    print(tool.call()) # [!code highlight]
    # Output: Patrick Rothfuss # [!code highlight]
else:
    print(response.content)
