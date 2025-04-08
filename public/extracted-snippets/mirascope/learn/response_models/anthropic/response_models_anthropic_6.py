#!/usr/bin/env python3
# Example 6: Output: ["The Name of the Wind", "Mistborn: The Final Empire"]
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import llm, prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", response_model=list[str])
@prompt_template("Extract book titles from {texts}")
def extract_book(texts: list[str]): ...


book = extract_book(
    [
        "The Name of the Wind by Patrick Rothfuss",
        "Mistborn: The Final Empire by Brandon Sanderson",
    ]
)
print(book)
# Output: ["The Name of the Wind", "Mistborn: The Final Empire"]
