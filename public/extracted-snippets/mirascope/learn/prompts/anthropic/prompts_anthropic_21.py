#!/usr/bin/env python3
# Example 21: Format Specifiers
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/prompts.mdx:656
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template("Recommend a {genre} book under ${price:.2f}") # [!code highlight]
def recommend_book(genre: str, price: float): ...


print(recommend_book("fantasy", 12.3456))
# Output: [BaseMessageParam(role='user', content='Recommend a fantasy book under $12.35')] # [!code highlight]
