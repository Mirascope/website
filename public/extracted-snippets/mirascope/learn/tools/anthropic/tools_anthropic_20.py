#!/usr/bin/env python3
# Example 20: Streaming Partial Tools
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/tools.mdx:948
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template


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


@llm.call(
    provider="anthropic",
    model="claude-3-5-sonnet-latest",
    tools=[get_book_author],
    stream={"partial_tools": True},
)
@prompt_template("Who wrote {books}?")
def identify_authors(books: list[str]): ...


stream = identify_authors(["The Name of the Wind", "Mistborn: The Final Empire"])
for chunk, tool in stream:
    if tool:
        if tool.delta is not None:  # partial tool
            print(tool.delta)
        else:
            print(tool.call())
    else:
        print(chunk.content, end="", flush=True)
