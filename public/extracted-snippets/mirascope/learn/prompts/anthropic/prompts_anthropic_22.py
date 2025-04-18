#!/usr/bin/env python3
# Example 22: Lists
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/prompts.mdx:678
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template(
    """
    Book themes:
    {themes:list}

    Character analysis:
    {characters:lists}
    """
)
def analyze_book(themes: list[str], characters: list[list[str]]): ...


prompt = analyze_book(
    themes=["redemption", "power", "friendship"],
    characters=[
        ["Name: Frodo", "Role: Protagonist"],
        ["Name: Gandalf", "Role: Mentor"],
    ],
)

print(prompt[0].content)
# Output:
# Book themes:
# redemption
# power
# friendship

# Character analysis:
# Name: Frodo
# Role: Protagonist

# Name: Gandalf
# Role: Mentor
