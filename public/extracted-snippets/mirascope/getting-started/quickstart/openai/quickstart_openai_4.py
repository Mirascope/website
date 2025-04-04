#!/usr/bin/env python3
# Example 4: JSON Mode
# Generated for provider: openai
# This file is auto-generated and should not be edited directly

@llm.call(provider="openai", model="gpt-4o-mini", json_mode=True)
def city_info(city: str) -> str:
    return f"Provide information about {city} in JSON format"


response = city_info("Tokyo")
print(response.content)  # This will be a JSON-formatted string
