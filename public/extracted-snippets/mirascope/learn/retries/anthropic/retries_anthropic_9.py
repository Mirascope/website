#!/usr/bin/env python3
# Example 9: Fallback
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/retries.mdx:327
# This file is auto-generated; any edits should be made in the source file

from anthropic import RateLimitError as AnthropicRateLimitError
from mirascope import llm
from mirascope.retries import FallbackError, fallback
from anthropic import RateLimitError as OpenAIRateLimitError


@fallback(
    OpenAIRateLimitError,
    [
        {
            "catch": AnthropicRateLimitError,
            "provider": "anthropic",
            "model": "claude-3-5-sonnet-latest",
        }
    ],
)
@llm.call("anthropic", "claude-3-5-sonnet-latest")
def answer_question(question: str) -> str:
    return f"Answer this question: {question}"


try:
    response = answer_question("What is the meaning of life?")
    if caught := getattr(response, "_caught", None):
        print(f"Exception caught: {caught}")
    print("### Response ###")
    print(response.content)
except FallbackError as e:
    print(e)
