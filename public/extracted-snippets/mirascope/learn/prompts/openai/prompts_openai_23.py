#!/usr/bin/env python3
# Example 23: Lists
# Generated for provider: openai
# Source: content/doc/mirascope/learn/prompts.mdx:718
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template(
    """
    Book themes:
    {themes:text}

    Character analysis:
    {characters:texts}
    """
)
def analyze_book(themes: str, characters: list[str]): ...


prompt = analyze_book(
    themes="redemption, power, friendship",
    characters=[
        "Name: Frodo, Role: Protagonist",
        "Name: Gandalf, Role: Mentor",
    ],
)

print(prompt[0].content)
# Output:
# [
#     TextPart(type="text", text="Book themes:"),
#     TextPart(type="text", text="redemption, power, friendship"),
#     TextPart(type="text", text="Character analysis:"),
#     TextPart(type="text", text="Name: Frodo, Role: Protagonist"),
#     TextPart(type="text", text="Name: Gandalf, Role: Mentor"),
# ]
