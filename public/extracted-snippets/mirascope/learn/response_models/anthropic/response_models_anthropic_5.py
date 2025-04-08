#!/usr/bin/env python3
# Example 5: Built-In Types
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", response_model=list[str])
def extract_book(texts: list[str]) -> str:
    return f"Extract book titles from {texts}"


book = extract_book(
    [
        "The Name of the Wind by Patrick Rothfuss",
        "Mistborn: The Final Empire by Brandon Sanderson",
    ]
)
print(book)
# Output: ["The Name of the Wind", "Mistborn: The Final Empire"]
