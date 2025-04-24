#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/doc/mirascope/learn/mcp/client.mdx:18
# This file is auto-generated; any edits should be made in the source file

import asyncio
from pathlib import Path

from mcp.client.stdio import StdioServerParameters
from mirascope.mcp import stdio_client

server_file = Path(__file__).parent / "server.py"

server_params = StdioServerParameters(
    command="uv",
    args=["run", "python", str(server_file)],
    env=None,
)


async def main() -> None:
    async with stdio_client(server_params) as client:
        prompts = await client.list_prompts()
        print(prompts[0])



asyncio.run(main())
