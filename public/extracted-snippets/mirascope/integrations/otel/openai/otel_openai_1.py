#!/usr/bin/env python3
# Example 1: OpenTelemetry
# Generated for provider: openai
# Source: content/doc/mirascope/integrations/otel.mdx:20
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from mirascope.integrations.otel import configure, with_otel # [!code highlight]

configure() # [!code highlight]


@with_otel() # [!code highlight]
@llm.call(provider="openai", model="gpt-4o-mini")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book."


print(recommend_book("fantasy"))
