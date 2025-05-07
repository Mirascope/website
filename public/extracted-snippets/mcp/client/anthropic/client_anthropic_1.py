#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/mcp/client.mdx:18
# This file is auto-generated; any edits should be made in the source file

import asyncio
from pathlib import Path

from mcp.client.stdio import StdioServerParameters
from mirascope.mcp import stdio_client

server_file = Path(__file__).parent / "server.py"

server_params = StdioServerParameters( # [!code highlight]
    command="uv", # [!code highlight]
    args=["run", "python", str(server_file)], # [!code highlight]
    env=None, # [!code highlight]
) # [!code highlight]


async def main() -> None:
    async with stdio_client(server_params) as client: # [!code highlight]
        prompts = await client.list_prompts()
        print(prompts[0])



asyncio.run(main())
