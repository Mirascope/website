#!/usr/bin/env python3
# Example 39: Pre-Made ToolKits
# Generated for provider: openai
# Source: content/docs/mirascope/learn/tools.mdx:1879
# This file is auto-generated; any edits should be made in the source file

from pathlib import Path

from mirascope import BaseDynamicConfig, Messages, llm
from mirascope.tools import FileSystemToolKit # [!code highlight]


@llm.call(provider="openai", model="gpt-4o-mini")
def write_blog_post(topic: str, output_file: Path) -> BaseDynamicConfig:
    toolkit = FileSystemToolKit(base_directory=output_file.parent) # [!code highlight]
    return {
        "messages": [
            Messages.User(
                content=f"Write a blog post about '{topic}' as a '{output_file.name}'."
            )
        ],
        "tools": toolkit.create_tools(), # [!code highlight]
    }


response = write_blog_post("machine learning", Path("introduction.html"))
if tool := response.tool:
    result = tool.call()
    print(result)
