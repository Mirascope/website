#!/usr/bin/env python3
# Example 1: Langfuse
# Generated for provider: anthropic
# Source: content/docs/mirascope/integrations/langfuse.mdx:20
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from mirascope.integrations.langfuse import with_langfuse # [!code highlight]


@with_langfuse() # [!code highlight]
@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book."


print(recommend_book("fantasy"))
