#!/usr/bin/env python3
# Example 24: Lists
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/prompts.mdx:763
# This file is auto-generated; any edits should be made in the source file

from mirascope import TextPart, prompt_template


@prompt_template(
    """
    Book themes:
    {themes:text} # [!code highlight]

    Character analysis:
    {characters:texts} # [!code highlight]
    """
)
def analyze_book(themes: TextPart, characters: list[TextPart]): ...


prompt = analyze_book(
    themes=TextPart(type="text", text="redemption, power, friendship"), # [!code highlight]
    characters=[ # [!code highlight]
        TextPart(type="text", text="Name: Frodo, Role: Protagonist"), # [!code highlight]
        TextPart(type="text", text="Name: Gandalf, Role: Mentor"), # [!code highlight]
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
