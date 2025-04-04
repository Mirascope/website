#!/usr/bin/env python3
# Example 1: Basic LLM Call
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def get_capital(country: str) -> str:
    return f"What is the capital of {country}?"


response = get_capital("Japan")
print(response.content)
