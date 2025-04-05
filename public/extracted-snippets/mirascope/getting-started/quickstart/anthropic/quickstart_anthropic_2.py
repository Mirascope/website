#!/usr/bin/env python3
# Example 2: Streaming Responses
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", stream=True)
def stream_city_info(city: str) -> str:
    return f"Provide a brief description of {city}."


for chunk, _ in stream_city_info("Tokyo"):
    print(chunk.content, end="", flush=True)
