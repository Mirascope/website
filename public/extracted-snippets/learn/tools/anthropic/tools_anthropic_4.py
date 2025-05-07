#!/usr/bin/env python3
# Example 4: Basic Usage and Syntax
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/tools.mdx:154
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template

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


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[get_book_author]) # [!code highlight]
@prompt_template("Who wrote {book}?")
def identify_author(book: str): ...


response = identify_author("The Name of the Wind")
if tool := response.tool: # [!code highlight]
    print(tool.call()) # [!code highlight]
    # Output: Patrick Rothfuss # [!code highlight]
else:
    print(response.content)
