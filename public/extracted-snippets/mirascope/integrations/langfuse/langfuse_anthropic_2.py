#!/usr/bin/env python3
# Example 2: Langfuse
# Generated for provider: anthropic
# Source: src/docs/mirascope/integrations/langfuse.mdx:35
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from mirascope.integrations.langfuse import with_langfuse


@with_langfuse()
@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


print(recommend_book("fantasy"))
