#!/usr/bin/env python3
# Example 18: Object Attribute Access
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/prompts.mdx:599
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template
from pydantic import BaseModel


class Book(BaseModel):
    title: str
    author: str


@prompt_template()
def recommend_book_prompt(book: Book) -> str:
    return f"I read {book.title} by {book.author}. What should I read next?" # [!code highlight]


book = Book(title="The Name of the Wind", author="Patrick Rothfuss")
print(recommend_book_prompt(book))
# Output: [BaseMessageParam(role='user', content='I read The Name of the Wind by Patrick Rothfuss. What should I read next?')] # [!code highlight]
