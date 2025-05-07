#!/usr/bin/env python3
# Example 14: Document Inputs
# Generated for provider: openai
# Source: content/docs/mirascope/learn/prompts.mdx:452
# This file is auto-generated; any edits should be made in the source file

from mirascope import DocumentPart, Messages, prompt_template


@prompt_template()
def recommend_book_prompt(previous_book_pdf: bytes) -> Messages.Type:
    return Messages.User(
        [
            "I just read this book:", # [!code highlight]
            DocumentPart( # [!code highlight]
                type="document", # [!code highlight]
                media_type="application/pdf", # [!code highlight]
                document=previous_book_pdf, # [!code highlight]
            ), # [!code highlight]
            "What should I read next?", # [!code highlight]
        ]
    )


print(recommend_book_prompt(b"..."))
# Output: [
#     BaseMessageParam(
#         role="user",
#         content=[
#             TextPart(type="text", text="I just read this book:"), # [!code highlight]
#             DocumentPart(type='document', media_type='application/pdf', document=b'...'), # [!code highlight]
#             TextPart(type="text", text="What should I read next?"), # [!code highlight]
#         ],
#     )
# ]
