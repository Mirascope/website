#!/usr/bin/env python3
# Example 26: Computed Fields (Dynamic Configuration)
# Generated for provider: openai
# Source: content/docs/mirascope/learn/prompts.mdx:829
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseDynamicConfig, prompt_template


@prompt_template("Recommend a {uppercase_genre} book") # [!code highlight]
def recommend_book_prompt(genre: str) -> BaseDynamicConfig:
    uppercase_genre = genre.upper() # [!code highlight]
    return {
        "computed_fields": {"uppercase_genre": uppercase_genre}, # [!code highlight]
    }


print(recommend_book_prompt("fantasy"))
# Output: [BaseMessageParam(role='user', content='Recommend a FANTASY book')] # [!code highlight]
