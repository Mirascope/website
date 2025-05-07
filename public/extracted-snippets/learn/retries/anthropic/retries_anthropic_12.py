#!/usr/bin/env python3
# Example 12: Fallback With Retries
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/retries.mdx:456
# This file is auto-generated; any edits should be made in the source file

from anthropic import RateLimitError as AnthropicRateLimitError
from mirascope import llm, prompt_template
from mirascope.retries import FallbackError, fallback
from anthropic import RateLimitError as OpenAIRateLimitError
from tenacity import (
    RetryError,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)


@fallback( # [!code highlight]
    RetryError, # [!code highlight]
    [ # [!code highlight]
        { # [!code highlight]
            "catch": RetryError, # [!code highlight]
            "provider": "anthropic", # [!code highlight]
            "model": "claude-3-5-sonnet-latest", # [!code highlight]
        } # [!code highlight]
    ], # [!code highlight]
) # [!code highlight]
@retry( # [!code highlight]
    retry=retry_if_exception_type((OpenAIRateLimitError, AnthropicRateLimitError)), # [!code highlight]
    stop=stop_after_attempt(3), # [!code highlight]
    wait=wait_exponential(multiplier=1, min=4, max=10), # [!code highlight]
) # [!code highlight]
@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Answer this question: {question}")
def answer_question(question: str): ...


try:
    response = answer_question("What is the meaning of life?")
    if caught := getattr(response, "_caught", None):
        print(f"Exception caught: {caught}")
    print("### Response ###")
    print(response.content)
except FallbackError as e:
    print(e)
