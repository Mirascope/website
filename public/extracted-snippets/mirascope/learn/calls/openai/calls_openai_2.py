#!/usr/bin/env python3
# Example 2: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/doc/mirascope/learn/calls.mdx:44
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
