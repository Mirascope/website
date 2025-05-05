#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/json_mode.mdx:85
# This file is auto-generated; any edits should be made in the source file

import json

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", json_mode=True) # [!code highlight]
def get_book_info(book_title: str) -> str: # [!code highlight]
    return f"Provide the author and genre of {book_title}"


response = get_book_info("The Name of the Wind")
print(json.loads(response.content))
# Output: {'author': 'Patrick Rothfuss', 'genre': 'Fantasy'} # [!code highlight]
