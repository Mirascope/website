#!/usr/bin/env python3
# Example 1: Langfuse
# Generated for provider: openai
# Source: src/docs/mirascope/integrations/langfuse.mdx:20
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from mirascope.integrations.langfuse import with_langfuse


@with_langfuse()
@llm.call(provider="openai", model="gpt-4o-mini")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book."


print(recommend_book("fantasy"))
