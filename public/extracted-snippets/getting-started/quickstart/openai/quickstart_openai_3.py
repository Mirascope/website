#!/usr/bin/env python3
# Example 3: Response Models
# Generated for provider: openai
# Source: content/docs/mirascope/getting-started/quickstart.mdx:84
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from pydantic import BaseModel


class Capital(BaseModel):
    city: str
    country: str


@llm.call(provider="openai", model="gpt-4o-mini", response_model=Capital)
def extract_capital(query: str) -> str:
    return f"{query}"


capital = extract_capital("The capital of France is Paris")
print(capital)
