#!/usr/bin/env python3
# Example 38: Pre-Made Tools
# Generated for provider: openai
# Source: src/docs/mirascope/learn/tools.mdx:1819
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from mirascope.tools import DuckDuckGoSearch


@llm.call(
    provider="openai",
    model="gpt-4o-mini",
    tools=[DuckDuckGoSearch],
)
@prompt_template("Recommend a {genre} book and summarize the story")
def research(genre: str): ...


response = research("fantasy")
if tool := response.tool:
    print(tool.call())
