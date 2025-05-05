#!/usr/bin/env python3
# Example 36: Pre-Made Tools
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/tools.mdx:1777
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from mirascope.tools import DuckDuckGoSearch # [!code highlight]


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[DuckDuckGoSearch]) # [!code highlight]
@prompt_template("Recommend a {genre} book and summarize the story")
def research(genre: str): ...


response = research("fantasy")
if tool := response.tool:
    print(tool.call())
