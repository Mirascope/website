#!/usr/bin/env python3
# Example 1: HyperDX
# Generated for provider: anthropic
# Source: src/docs/mirascope/integrations/hyperdx.mdx:20
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from mirascope.integrations.otel import with_hyperdx


@with_hyperdx()
@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book."


print(recommend_book("fantasy"))
