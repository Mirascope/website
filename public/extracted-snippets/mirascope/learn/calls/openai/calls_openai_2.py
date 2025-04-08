#!/usr/bin/env python3
# Example 2: Basic Usage and Syntax
# Generated for provider: openai
# This file is auto-generated and should not be edited directly

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
