#!/usr/bin/env python3
# Example 3: Message Caching
# Generated for provider: openai
# Source: src/docs/mirascope/learn/provider-specific/anthropic.mdx:108
# This file is auto-generated; any edits should be made in the source file

from mirascope.core import BaseTool, anthropic
from mirascope.core.anthropic import AnthropicToolConfig


class CachedTool(BaseTool):
    """This is an example of a cached tool."""

    tool_config = AnthropicToolConfig(cache_control={"type": "ephemeral"})

    def call(self) -> str:
        return "Example tool"


@anthropic.call(
    "claude-3-5-sonnet-20240620",
    tools=[CachedTool],
    call_params={
        "max_tokens": 1024,
        "extra_headers": {"anthropic-beta": "prompt-caching-2024-07-31"},
    },
)
def cached_tool_call() -> str:
    return "An example call with a cached tool"
