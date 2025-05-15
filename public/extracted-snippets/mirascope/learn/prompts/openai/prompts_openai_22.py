#!/usr/bin/env python3
# Example 22: Lists
# Generated for provider: openai
# Source: content/docs/mirascope/learn/prompts.mdx:630
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template(
    """
    Book themes:
    {themes:list} # [!code highlight]

    Character analysis:
    {characters:lists} # [!code highlight]
    """
)
def analyze_book(themes: list[str], characters: list[list[str]]): ...


prompt = analyze_book(
    themes=["redemption", "power", "friendship"], # [!code highlight]
    characters=[ # [!code highlight]
        ["Name: Frodo", "Role: Protagonist"], # [!code highlight]
        ["Name: Gandalf", "Role: Mentor"], # [!code highlight]
    ], # [!code highlight]
)

print(prompt[0].content)
# Output:
# [!code highlight:12]
# Book themes:
# redemption
# power
# friendship

# Character analysis:
# Name: Frodo
# Role: Protagonist

# Name: Gandalf
# Role: Mentor
