#!/usr/bin/env python3
# Example 5: Basic Usage
# Generated for provider: openai
# Source: content/doc/mirascope/learn/provider-specific/openai.mdx:223
# This file is auto-generated; any edits should be made in the source file

import asyncio
from io import BytesIO

from collections.abc import AsyncGenerator
from typing import Any

from pydub import AudioSegment
from pydub.playback import play

from mirascope.beta.openai import Realtime, record_as_stream

app = Realtime(
    "gpt-4o-realtime-preview-2024-10-01",
)


@app.receiver("audio")
async def receive_audio(response: AudioSegment, context: dict[str, Any]) -> None:
    play(response)


@app.receiver("audio_transcript")
async def receive_audio_transcript(response: str, context: dict[str, Any]) -> None:
    print(f"AI(audio_transcript): {response}")


@app.sender()
async def send_audio_as_stream(
    context: dict[str, Any],
) -> AsyncGenerator[BytesIO, None]:
    print("Sending audio...")
    async for stream in record_as_stream():
        yield stream


asyncio.run(app.run())
