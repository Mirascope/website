#!/usr/bin/env python3
# Example 39: Pre-Made ToolKits
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/tools.mdx:1883
# This file is auto-generated; any edits should be made in the source file

from pathlib import Path

from mirascope import BaseDynamicConfig, Messages, llm
from mirascope.tools import FileSystemToolKit


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def write_blog_post(topic: str, output_file: Path) -> BaseDynamicConfig:
    toolkit = FileSystemToolKit(base_directory=output_file.parent)
    return {
        "messages": [
            Messages.User(
                content=f"Write a blog post about '{topic}' as a '{output_file.name}'."
            )
        ],
        "tools": toolkit.create_tools(),
    }


response = write_blog_post("machine learning", Path("introduction.html"))
if tool := response.tool:
    result = tool.call()
    print(result)
