#!/usr/bin/env python3
# Example 3: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/docs/mirascope/learn/tools.mdx:122
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm

# [!code highlight:13]
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


@llm.call(provider="openai", model="gpt-4o-mini", tools=[get_book_author]) # [!code highlight]
def identify_author(book: str) -> str:
    return f"Who wrote {book}?"


response = identify_author("The Name of the Wind")
if tool := response.tool: # [!code highlight]
    print(tool.call()) # [!code highlight]
    # Output: Patrick Rothfuss # [!code highlight]
else:
    print(response.content)
