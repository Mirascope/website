#!/usr/bin/env python3
# Example 31: Few-Shot Examples
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/tools.mdx:1462
# This file is auto-generated; any edits should be made in the source file

from typing import Annotated

from pydantic import Field

from mirascope import llm


def get_book_author(
    title: Annotated[
        str,
        Field(
            ...,
            description="The title of the book.",
            examples=["The Name of the Wind"], # [!code highlight]
        ),
    ],
) -> str:
    """Returns the author of the book with the given title

    Example: # [!code highlight]
        {"title": "The Name of the Wind"} # [!code highlight]

    Args:
        title: The title of the book.
    """
    if title == "The Name of the Wind":
        return "Patrick Rothfuss"
    elif title == "Mistborn: The Final Empire":
        return "Brandon Sanderson"
    else:
        return "Unknown"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[get_book_author])
def identify_author(book: str) -> str:
    return f"Who wrote {book}?"


response = identify_author("The Name of the Wind")
if tool := response.tool:
    print(tool.call())
else:
    print(response.content)
