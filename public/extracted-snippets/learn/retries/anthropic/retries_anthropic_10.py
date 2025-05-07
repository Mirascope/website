#!/usr/bin/env python3
# Example 10: Fallback
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/retries.mdx:363
# This file is auto-generated; any edits should be made in the source file

from anthropic import RateLimitError as AnthropicRateLimitError
from mirascope import llm, prompt_template
from mirascope.retries import FallbackError, fallback
from anthropic import RateLimitError as OpenAIRateLimitError


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
@prompt_template("Answer this question: {question}")
def answer_question(question: str): ...


try:
    response = answer_question("What is the meaning of life?")
    if caught := getattr(response, "_caught", None): # [!code highlight]
        print(f"Exception caught: {caught}")
    print("### Response ###")
    print(response.content)
except FallbackError as e: # [!code highlight]
    print(e)
