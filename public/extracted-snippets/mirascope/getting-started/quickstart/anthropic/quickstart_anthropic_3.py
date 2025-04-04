#!/usr/bin/env python3
# Example 3: Response Models
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import llm
from pydantic import BaseModel


class Capital(BaseModel):
    city: str
    country: str


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", response_model=Capital)
def extract_capital(query: str) -> str:
    return f"{query}"


capital = extract_capital("The capital of France is Paris")
print(capital)
