#!/usr/bin/env python3
# Example 4: Provider-Agnostic
# Generated for provider: openai
# Source: src/docs/mirascope/getting-started/why.mdx:154
# This file is auto-generated; any edits should be made in the source file

from mirascope.core import anthropic, openai, prompt_template


@prompt_template()
def recommend_book_prompt(genre: str) -> str:
    return f"Recommend a {genre} book"


# OpenAI
openai_model = "gpt-4o-mini"
openai_recommend_book = openai.call(openai_model)(recommend_book_prompt)
openai_response = openai_recommend_book("fantasy")
print(openai_response.content)

# Anthropic
anthropic_model = "claude-3-5-sonnet-20240620"
anthropic_recommend_book = anthropic.call(anthropic_model)(recommend_book_prompt)
anthropic_response = anthropic_recommend_book("fantasy")
print(anthropic_response.content)
