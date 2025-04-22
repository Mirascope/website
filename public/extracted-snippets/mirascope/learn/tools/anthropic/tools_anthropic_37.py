#!/usr/bin/env python3
# Example 37: Pre-Made Tools
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/tools.mdx:1799
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from mirascope.tools import DuckDuckGoSearch


@llm.call(
    provider="anthropic",
    model="claude-3-5-sonnet-latest",
    tools=[DuckDuckGoSearch],
)
def research(genre: str) -> str:
    return f"Recommend a {genre} book and summarize the story"


response = research("fantasy")
if tool := response.tool:
    print(tool.call())
