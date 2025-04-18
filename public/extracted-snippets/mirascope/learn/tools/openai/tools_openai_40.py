#!/usr/bin/env python3
# Example 40: Pre-Made ToolKits
# Generated for provider: openai
# Source: src/docs/mirascope/learn/tools.mdx:1910
# This file is auto-generated; any edits should be made in the source file

from pathlib import Path

from mirascope import BaseDynamicConfig, Messages, llm, prompt_template
from mirascope.tools import FileSystemToolKit


@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Write a blog post about '{topic}' as a '{output_file.name}'.")
def write_blog_post(topic: str, output_file: Path) -> BaseDynamicConfig:
    toolkit = FileSystemToolKit(base_directory=output_file.parent)
    return {
        "messages": [
            Messages.User(
                content="Write a blog post about '{topic}' as a '{output_file.name}'."
            )
        ],
        "tools": toolkit.create_tools(),
    }


response = write_blog_post("machine learning", Path("introduction.html"))
if tool := response.tool:
    result = tool.call()
    print(result)
