#!/usr/bin/env python3
# Example 20: Format Specifiers
# Generated for provider: openai
# Source: content/doc/mirascope/learn/prompts.mdx:643
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template()
def recommend_book(genre: str, price: float) -> str:
    return f"Recommend a {genre} book under ${price:.2f}"


print(recommend_book("fantasy", 12.3456))
# Output: [BaseMessageParam(role='user', content='Recommend a fantasy book under $12.35')]
