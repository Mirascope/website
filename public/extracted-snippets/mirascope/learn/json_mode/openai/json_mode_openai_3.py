#!/usr/bin/env python3
# Example 3: Error Handling and Validation
# Generated for provider: openai
# This file is auto-generated and should not be edited directly

import json

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini", json_mode=True)
def get_book_info(book_title: str) -> str:
    return f"Provide the author and genre of {book_title}"


try:
    response = get_book_info("The Name of the Wind")
    print(json.loads(response.content))
except json.JSONDecodeError:
    print("The model produced invalid JSON")
