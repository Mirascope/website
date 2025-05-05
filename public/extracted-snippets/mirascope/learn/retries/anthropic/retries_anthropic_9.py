#!/usr/bin/env python3
# Example 9: Fallback
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/retries.mdx:328
# This file is auto-generated; any edits should be made in the source file

from anthropic import RateLimitError as AnthropicRateLimitError
from mirascope import llm
from mirascope.retries import FallbackError, fallback
from openai import RateLimitError as OpenAIRateLimitError


@fallback( # [!code highlight]
    OpenAIRateLimitError, # [!code highlight]
    [ # [!code highlight]
        { # [!code highlight]
            "catch": AnthropicRateLimitError, # [!code highlight]
            "provider": "anthropic", # [!code highlight]
            "model": "claude-3-5-sonnet-latest", # [!code highlight]
        } # [!code highlight]
    ], # [!code highlight]
) # [!code highlight]
@llm.call("openai", "gpt-4o-mini")
def answer_question(question: str) -> str:
    return f"Answer this question: {question}"


try:
    response = answer_question("What is the meaning of life?")
    if caught := getattr(response, "_caught", None): # [!code highlight]
        print(f"Exception caught: {caught}")
    print("### Response ###")
    print(response.content)
except FallbackError as e: # [!code highlight]
    print(e)
