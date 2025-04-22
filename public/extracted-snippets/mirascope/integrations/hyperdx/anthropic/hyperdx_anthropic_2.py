#!/usr/bin/env python3
# Example 2: HyperDX
# Generated for provider: anthropic
# Source: content/doc/mirascope/integrations/hyperdx.mdx:36
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from mirascope.integrations.otel import with_hyperdx


@with_hyperdx()
@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


print(recommend_book("fantasy"))
