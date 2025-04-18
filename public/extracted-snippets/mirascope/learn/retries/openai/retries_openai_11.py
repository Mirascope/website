#!/usr/bin/env python3
# Example 11: Fallback With Retries
# Generated for provider: openai
# Source: src/docs/mirascope/learn/retries.mdx:408
# This file is auto-generated; any edits should be made in the source file

from anthropic import RateLimitError as AnthropicRateLimitError
from mirascope import llm
from mirascope.retries import FallbackError, fallback
from openai import RateLimitError as OpenAIRateLimitError
from tenacity import (
    RetryError,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)


@fallback(
    RetryError,
    [
        {
            "catch": RetryError,
            "provider": "anthropic",
            "model": "claude-3-5-sonnet-latest",
        }
    ],
)
@retry(
    retry=retry_if_exception_type((OpenAIRateLimitError, AnthropicRateLimitError)),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
)
@llm.call("openai", "gpt-4o-mini")
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
