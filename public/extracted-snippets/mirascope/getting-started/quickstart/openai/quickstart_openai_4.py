#!/usr/bin/env python3
# Example 4: JSON Mode
# Generated for provider: openai
# Source: src/docs/mirascope/getting-started/quickstart.mdx:111
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini", json_mode=True)
def city_info(city: str) -> str:
    return f"Provide information about {city} in JSON format"


response = city_info("Tokyo")
print(response.content)  # This will be a JSON-formatted string
