#!/usr/bin/env python3
# Example 7: Basic Usage
# Generated for provider: openai
# Source: content/docs/mirascope/learn/provider-specific/openai.mdx:312
# This file is auto-generated; any edits should be made in the source file

import asyncio
from io import BytesIO

from collections.abc import AsyncGenerator
from typing import Any

from pydub import AudioSegment
from pydub.playback import play

from mirascope.beta.openai import Realtime, record_as_stream, async_input


app = Realtime(
    "gpt-4o-realtime-preview-2024-10-01",
    turn_detection=None,
)


@app.receiver("audio")
async def receive_audio(response: AudioSegment, context: dict[str, Any]) -> None:
    play(response)


@app.receiver("audio_transcript")
async def receive_audio_transcript(response: str, context: dict[str, Any]) -> None:
    print(f"AI(audio_transcript): {response}")


@app.sender(wait_for_audio_transcript_response=True)
async def send_audio_as_stream(
    context: dict[str, Any],
) -> AsyncGenerator[BytesIO, None]:
    message = await async_input(
        "Press Enter to start recording or enter exit to shutdown app"
    )
    if message == "exit":
        raise asyncio.CancelledError

    async def wait_for_enter() -> str:
        return await async_input("Press Enter to stop recording...")

    async for stream in record_as_stream(custom_blocking_event=wait_for_enter):
        yield stream


asyncio.run(app.run())
