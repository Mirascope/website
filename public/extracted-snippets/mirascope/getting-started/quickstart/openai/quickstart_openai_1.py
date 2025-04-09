#!/usr/bin/env python3
# Example 1: Basic LLM Call
# Generated for provider: openai
# Source: src/docs/mirascope/getting-started/quickstart.mdx:22
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini")
def get_capital(country: str) -> str:
    return f"What is the capital of {country}?"


response = get_capital("Japan")
print(response.content)
