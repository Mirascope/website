#!/usr/bin/env python3
# Example 6: Tools
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/retries.mdx:176
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from tenacity import retry, stop_after_attempt, wait_exponential


def get_book_author(title: str) -> str:
    if title == "The Name of the Wind":
        return "Patrick Rothfuss"
    elif title == "Mistborn: The Final Empire":
        return "Brandon Sanderson"
    else:
        return "Unknown"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[get_book_author])
@prompt_template("Who wrote {book}?")
def identify_author(book: str): ...


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
)
def run():
    response = identify_author("The Name of the Wind")
    if tool := response.tool:
        print(tool.call())
        print(f"Original tool call: {tool.tool_call}")
    else:
        print(response.content)


run()
