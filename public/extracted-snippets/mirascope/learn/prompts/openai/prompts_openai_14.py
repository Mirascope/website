#!/usr/bin/env python3
# Example 14: Document Inputs
# Generated for provider: openai
# Source: content/doc/mirascope/learn/prompts.mdx:452
# This file is auto-generated; any edits should be made in the source file

from mirascope import DocumentPart, Messages, prompt_template


@prompt_template()
def recommend_book_prompt(previous_book_pdf: bytes) -> Messages.Type:
    return Messages.User(
        [
            "I just read this book:",
            DocumentPart(
                type="document",
                media_type="application/pdf",
                document=previous_book_pdf,
            ),
            "What should I read next?",
        ]
    )


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
