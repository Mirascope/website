#!/usr/bin/env python3
# Example 15: Document Inputs
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/prompts.mdx:485
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template


@prompt_template(
    "I just read this book: {previous_book:document} What should I read next?"
)
def recommend_book_prompt(previous_book: bytes): ...


print(recommend_book_prompt(b"..."))
# Output: [
#     BaseMessageParam(
#         role="user",
#         content=[
#             TextPart(type="text", text="I just read this book:"),
#             DocumentPart(type='document', media_type='application/pdf', document=b'...'),
#             TextPart(type="text", text="What should I read next?"),
#         ],
#     )
# ]
