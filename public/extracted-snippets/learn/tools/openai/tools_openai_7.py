#!/usr/bin/env python3
# Example 7: Accessing Original Tool Call
# Generated for provider: openai
# Source: content/docs/mirascope/learn/tools.mdx:288
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


@llm.call(provider="openai", model="gpt-4o-mini", tools=[get_book_author])
def identify_author(book: str) -> str:
    return f"Who wrote {book}?"


response = identify_author("The Name of the Wind")
if tool := response.tool:
    print(tool.call())
    # Output: Patrick Rothfuss
    print(f"Original tool call: {tool.tool_call}") # [!code highlight]
else:
    print(response.content)
