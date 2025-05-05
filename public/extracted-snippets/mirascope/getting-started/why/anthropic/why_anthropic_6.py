#!/usr/bin/env python3
# Example 6: Provider-Agnostic When Wanted, Specific When Needed
# Generated for provider: anthropic
# Source: content/doc/mirascope/getting-started/why.mdx:194
# This file is auto-generated; any edits should be made in the source file

from mirascope.core import anthropic, openai, prompt_template


@prompt_template() # [!code highlight]
def recommend_book_prompt(genre: str) -> str: # [!code highlight]
    return f"Recommend a {genre} book"


# OpenAI
openai_model = "gpt-4o-mini"
openai_recommend_book = openai.call(openai_model)(recommend_book_prompt) # [!code highlight]
openai_response = openai_recommend_book("fantasy") # [!code highlight]
print(openai_response.content)

# Anthropic
anthropic_model = "claude-3-5-sonnet-latest"
anthropic_recommend_book = anthropic.call(anthropic_model)(recommend_book_prompt) # [!code highlight]
anthropic_response = anthropic_recommend_book("fantasy") # [!code highlight]
print(anthropic_response.content)
