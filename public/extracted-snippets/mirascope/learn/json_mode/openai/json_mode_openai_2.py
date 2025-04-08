#!/usr/bin/env python3
# Example 2: Output: {'author': 'Patrick Rothfuss', 'genre': 'Fantasy'}
# Generated for provider: openai
# This file is auto-generated and should not be edited directly

import json

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini", json_mode=True)
@prompt_template("Provide the author and genre of {book_title}")
def get_book_info(book_title: str): ...


response = get_book_info("The Name of the Wind")
print(json.loads(response.content))
# Output: {'author': 'Patrick Rothfuss', 'genre': 'Fantasy'}
