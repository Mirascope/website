#!/usr/bin/env python3
# Example 1: Message Caching
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/provider-specific/anthropic.mdx:25
# This file is auto-generated; any edits should be made in the source file

import inspect

from mirascope import CacheControlPart, Messages
from mirascope.core import anthropic


@anthropic.call(
    "claude-3-5-sonnet-20240620",
    call_params={
        "max_tokens": 1024,
        "extra_headers": {"anthropic-beta": "prompt-caching-2024-07-31"}, # [!code highlight]
    },
)
def analyze_book(query: str, book: str) -> Messages.Type:
    return [
        Messages.System(
            [
                inspect.cleandoc(
            f"""
            You are an AI assistant tasked with analyzing literary works.
            Your goal is to provide insightful commentary on themes, characters, and writing style.
                            
            Here is the book in it's entirety: {book}
            """),
                CacheControlPart(type="cache_control", cache_type="ephemeral"), # [!code highlight]
            ]
        ),
        Messages.User(query),
    ]


print(analyze_book("What are the major themes?", "[FULL BOOK HERE]"))
