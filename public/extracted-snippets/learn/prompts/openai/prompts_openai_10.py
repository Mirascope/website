#!/usr/bin/env python3
# Example 10: Audio Inputs
# Generated for provider: openai
# Source: content/docs/mirascope/learn/prompts.mdx:341
# This file is auto-generated; any edits should be made in the source file

from mirascope import Messages, prompt_template
from pydub import AudioSegment


@prompt_template()
def identify_book_prompt(audio_wave: AudioSegment) -> Messages.Type:
    return ["Here's an audio book snippet:", audio_wave, "What book is this?"] # [!code highlight]


with open("....", "rb") as audio:
    print(identify_book_prompt(AudioSegment.from_mp3(audio)))
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
