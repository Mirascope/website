#!/usr/bin/env python3
# Example 11: Parallel Tool Calls
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/tools.mdx:586
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


def get_book_author(title: str) -> str:
    """Returns the author of the book with the given title

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
def identify_authors(books: list[str]) -> str:
    return f"Who wrote {books}?"


# [!code highlight:5]
response = identify_authors(["The Name of the Wind", "Mistborn: The Final Empire"])
if tools := response.tools:
    for tool in tools:
        print(tool.call())
else:
    print(response.content)
