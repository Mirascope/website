#!/usr/bin/env python3
# Example 2: OpenTelemetry
# Generated for provider: anthropic
# Source: content/doc/mirascope/integrations/otel.mdx:38
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from mirascope.integrations.otel import configure, with_otel # [!code highlight]

configure() # [!code highlight]


@with_otel() # [!code highlight]
@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


print(recommend_book("fantasy"))
