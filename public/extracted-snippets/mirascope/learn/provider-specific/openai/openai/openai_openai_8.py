#!/usr/bin/env python3
# Example 8: Basic Usage
# Generated for provider: openai
# Source: content/doc/mirascope/learn/provider-specific/openai.mdx:362
# This file is auto-generated; any edits should be made in the source file

import asyncio
from io import BytesIO

from collections.abc import AsyncGenerator
from typing import Any

from pydub import AudioSegment
from pydub.playback import play

from mirascope.beta.openai import Realtime, record_as_stream, OpenAIRealtimeTool


def format_book(title: str, author: str) -> str:
    return f"{title} by {author}"


app = Realtime("gpt-4o-realtime-preview-2024-10-01", tools=[format_book])


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


@app.function_call(format_book)
async def recommend_book(tool: OpenAIRealtimeTool, context: dict[str, Any]) -> str:
    result = tool.call()
    print(result)
    return result


asyncio.run(app.run())
