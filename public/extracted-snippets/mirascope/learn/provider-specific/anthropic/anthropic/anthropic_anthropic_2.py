#!/usr/bin/env python3
# Example 2: Message Caching
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/provider-specific/anthropic.mdx:63
# This file is auto-generated; any edits should be made in the source file

from mirascope import prompt_template
from mirascope.core import anthropic


@anthropic.call(
    "claude-3-5-sonnet-20240620",
    call_params={
        "max_tokens": 1024,
        "extra_headers": {"anthropic-beta": "prompt-caching-2024-07-31"},
    },
)
@prompt_template(
    """
    SYSTEM:
    You are an AI assistant tasked with analyzing literary works.
    Your goal is to provide insightful commentary on themes, characters, and writing style.

    Here is the book in it's entirety: {book}

    {:cache_control}

    USER: {query}
    """
)
def analyze_book(query: str, book: str): ...


print(analyze_book("What are the major themes?", "[FULL BOOK HERE]"))
