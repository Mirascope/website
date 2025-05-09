#!/usr/bin/env python3
# Example 1: HyperDX
# Generated for provider: openai
# Source: content/docs/mirascope/integrations/hyperdx.mdx:20
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from mirascope.integrations.otel import with_hyperdx # [!code highlight]


@with_hyperdx() # [!code highlight]
@llm.call(provider="openai", model="gpt-4o-mini")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book."


print(recommend_book("fantasy"))
