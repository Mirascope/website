#!/usr/bin/env python3
# Example 13: Audio Inputs
# Generated for provider: openai
# Source: src/docs/mirascope/learn/prompts.mdx:418
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template
@prompt_template("Here's an audio book snippet: {audio_wave:audio} What book is this?")
def identify_book_prompt(audio_wave: bytes): ...


print(identify_book_prompt(b"..."))
# Output: [
#     BaseMessageParam(
#         role="user",
#         content=[
#             TextPart(type="text", text="Here's an audio book snippet:"),
#             AudioPart(type='audio', media_type='audio/wav', audio=b'...'),
#             TextPart(type="text", text="What book is this?"),
#         ],
#     )
# ]
