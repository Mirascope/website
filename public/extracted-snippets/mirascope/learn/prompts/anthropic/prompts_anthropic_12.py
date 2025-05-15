#!/usr/bin/env python3
# Example 12: Audio Inputs
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/prompts.mdx:344
# This file is auto-generated; any edits should be made in the source file

import wave
from mirascope import Messages, prompt_template


@prompt_template()
def identify_book_prompt(audio_wave: wave.Wave_read) -> Messages.Type:
    return ["Here's an audio book snippet:", audio_wave, "What book is this?"] # [!code highlight]


with open("....", "rb") as f, wave.open(f, "rb") as audio:
    print(identify_book_prompt(audio))
# Output: [
#     BaseMessageParam(
#         role="user",
#         content=[
#             TextPart(type="text", text="Here's an audio book snippet:"), # [!code highlight]
#             AudioPart(type='audio', media_type='audio/wav', audio=b'...'), # [!code highlight]
#             TextPart(type="text", text="What book is this?"), # [!code highlight]
#         ],
#     )
# ]
