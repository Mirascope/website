#!/usr/bin/env python3
# Example 15: Streaming Tools
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/tools.mdx:738
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


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[get_book_author], stream=True)
def identify_authors(books: list[str]) -> str:
    return f"Who wrote {books}?"


stream = identify_authors(["The Name of the Wind", "Mistborn: The Final Empire"])
for chunk, tool in stream:
    if tool:
        print(tool.call())
    else:
        print(chunk.content, end="", flush=True)
