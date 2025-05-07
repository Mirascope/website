#!/usr/bin/env python3
# Example 23: Lists
# Generated for provider: openai
# Source: content/docs/mirascope/learn/prompts.mdx:719
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template(
    """
    Book themes:
    {themes:text} # [!code highlight]

    Character analysis:
    {characters:texts} # [!code highlight]
    """
)
def analyze_book(themes: str, characters: list[str]): ...


prompt = analyze_book(
    themes="redemption, power, friendship", # [!code highlight]
    characters=[ # [!code highlight]
        "Name: Frodo, Role: Protagonist", # [!code highlight]
        "Name: Gandalf, Role: Mentor", # [!code highlight]
    ], # [!code highlight]
)

print(prompt[0].content)
# Output:
# [!code highlight:8]
# [
#     TextPart(type="text", text="Book themes:"),
#     TextPart(type="text", text="redemption, power, friendship"),
#     TextPart(type="text", text="Character analysis:"),
#     TextPart(type="text", text="Name: Frodo, Role: Protagonist"),
#     TextPart(type="text", text="Name: Gandalf, Role: Mentor"),
# ]
