#!/usr/bin/env python3
# Example 5: Built-In Types
# Generated for provider: openai
# Source: src/docs/mirascope/learn/response_models.mdx:154
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini", response_model=list[str])
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
