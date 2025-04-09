#!/usr/bin/env python3
# Example 25: Computed Fields (Dynamic Configuration)
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/prompts.mdx:797
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseDynamicConfig, Messages, prompt_template


@prompt_template()
def recommend_book_prompt(genre: str) -> BaseDynamicConfig:
    uppercase_genre = genre.upper()
    messages = [Messages.User(f"Recommend a {uppercase_genre} book")]
    return {
        "messages": messages,
        "computed_fields": {"uppercase_genre": uppercase_genre},
    }


print(recommend_book_prompt("fantasy"))
# Output: {
#     "messages": [BaseMessageParam(role="user", content="Recommend a FANTASY book")],
#     "computed_fields": {"uppercase_genre": "FANTASY"},
# }
