#!/usr/bin/env python3
# Example 37: Pre-Made Tools
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/tools.mdx:1797
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from mirascope.tools import DuckDuckGoSearch, DuckDuckGoSearchConfig # [!code highlight]

config = DuckDuckGoSearchConfig(max_results_per_query=5) # [!code highlight]
CustomSearch = DuckDuckGoSearch.from_config(config) # [!code highlight]


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[CustomSearch]) # [!code highlight]
def research(genre: str) -> str:
    return f"Recommend a {genre} book and summarize the story"


response = research("fantasy")
if tool := response.tool:
    print(tool.call())
