#!/usr/bin/env python3
# Example 1: OpenTelemetry
# Generated for provider: openai
# Source: src/docs/mirascope/integrations/otel.mdx:19
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from mirascope.integrations.otel import configure, with_otel

configure()


@with_otel()
@llm.call(provider="openai", model="gpt-4o-mini")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book."


print(recommend_book("fantasy"))
