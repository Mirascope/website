#!/usr/bin/env python3
# Example 6: Asynchronous Processing
# Generated for provider: openai
# This file is auto-generated and should not be edited directly

from mirascope import llm
import asyncio
from pydantic import BaseModel


class Capital(BaseModel):
    city: str
    country: str


@llm.call(provider="openai", model="gpt-4o-mini", response_model=Capital)
async def get_capital_async(country: str) -> str:
    return f"What is the capital of {country}?"


async def main():
    countries = ["France", "Japan", "Brazil"]
    tasks = [get_capital_async(country) for country in countries]
    capitals = await asyncio.gather(*tasks)
    for capital in capitals:
        print(f"The capital of {capital.country} is {capital.city}")


# await main() when running in a Jupyter notebook
await main()

# asyncio.run(main()) when running in a Python script
