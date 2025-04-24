#!/usr/bin/env python3
# Example 4: Error Handling and Validation
# Generated for provider: openai
# Source: content/doc/mirascope/learn/json_mode.mdx:151
# This file is auto-generated; any edits should be made in the source file

import json

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini", json_mode=True)
@prompt_template("Provide the author and genre of {book_title}")
def get_book_info(book_title: str): ...


try:
    response = get_book_info("The Name of the Wind")
    print(json.loads(response.content))
except json.JSONDecodeError:
    print("The model produced invalid JSON")
