#!/usr/bin/env python3
# Example 5: This will be a JSON-formatted string
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import llm
from pydantic import BaseModel


class CityInfo(BaseModel):
    name: str
    population: int
    country: str


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", json_mode=True, response_model=CityInfo)
def city_info(city: str) -> str:
    return f"Provide information about {city} in JSON format"


response = city_info("Tokyo")
print(
    f"Name: {response.name}, Population: {response.population}, Country: {response.country}"
)
