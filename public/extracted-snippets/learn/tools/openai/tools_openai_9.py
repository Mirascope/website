#!/usr/bin/env python3
# Example 9: Parallel Tool Calls
# Generated for provider: openai
# Source: content/docs/mirascope/learn/tools.mdx:514
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


@llm.call(provider="openai", model="gpt-4o-mini", tools=[GetBookAuthor])
def identify_authors(books: list[str]) -> str:
    return f"Who wrote {books}?"


# [!code highlight:5]
response = identify_authors(["The Name of the Wind", "Mistborn: The Final Empire"])
if tools := response.tools:
    for tool in tools:
        print(tool.call())
else:
    print(response.content)
