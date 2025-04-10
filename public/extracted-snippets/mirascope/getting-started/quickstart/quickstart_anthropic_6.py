#!/usr/bin/env python3
# Example 6: Asynchronous Processing
# Generated for provider: anthropic
# Source: src/docs/mirascope/getting-started/quickstart.mdx:216
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
import asyncio
from pydantic import BaseModel


class Capital(BaseModel):
    city: str
    country: str


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", response_model=Capital)
async def get_capital_async(country: str) -> str:
    return f"What is the capital of {country}?"


async def main():
    countries = ["France", "Japan", "Brazil"]
    tasks = [get_capital_async(country) for country in countries]
    capitals = await asyncio.gather(*tasks)
    for capital in capitals:
        print(f"The capital of {capital.country} is {capital.city}")


# For a Python script, uncomment this line:
# asyncio.run(main())

# For demonstration purposes only (this won't work in a regular Python script):
# In a Jupyter notebook or interactive environment you would use:
# await main()
