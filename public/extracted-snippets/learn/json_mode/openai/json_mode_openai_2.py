#!/usr/bin/env python3
# Example 2: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/docs/mirascope/learn/json_mode.mdx:102
# This file is auto-generated; any edits should be made in the source file

import json

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini", json_mode=True) # [!code highlight]
@prompt_template("Provide the author and genre of {book_title}") # [!code highlight]
def get_book_info(book_title: str): ...


response = get_book_info("The Name of the Wind")
print(json.loads(response.content))
# Output: {'author': 'Patrick Rothfuss', 'genre': 'Fantasy'} # [!code highlight]
