#!/usr/bin/env python3
# Example 26: Computed Fields (Dynamic Configuration)
# Generated for provider: openai
# Source: content/doc/mirascope/learn/prompts.mdx:819
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseDynamicConfig, prompt_template


@prompt_template("Recommend a {uppercase_genre} book")
def recommend_book_prompt(genre: str) -> BaseDynamicConfig:
    uppercase_genre = genre.upper()
    return {
        "computed_fields": {"uppercase_genre": uppercase_genre},
    }


print(recommend_book_prompt("fantasy"))
# Output: [BaseMessageParam(role='user', content='Recommend a FANTASY book')]
