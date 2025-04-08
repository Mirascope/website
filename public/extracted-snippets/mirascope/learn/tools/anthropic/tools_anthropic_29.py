#!/usr/bin/env python3
# Example 29: Few-Shot Examples
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/tools.mdx:1380
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseTool, llm
from pydantic import ConfigDict, Field


class GetBookAuthor(BaseTool):
    """Returns the author of the book with the given title."""

    title: str = Field(
        ...,
        description="The title of the book.",
        examples=["The Name of the Wind"],
    )

    model_config = ConfigDict(
        json_schema_extra={"examples": [{"title": "The Name of the Wind"}]}
    )

    def call(self) -> str:
        if self.title == "The Name of the Wind":
            return "Patrick Rothfuss"
        elif self.title == "Mistborn: The Final Empire":
            return "Brandon Sanderson"
        else:
            return "Unknown"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[GetBookAuthor])
def identify_author(book: str) -> str:
    return f"Who wrote {book}?"


response = identify_author("The Name of the Wind")
if tool := response.tool:
    print(tool.call())
else:
    print(response.content)
