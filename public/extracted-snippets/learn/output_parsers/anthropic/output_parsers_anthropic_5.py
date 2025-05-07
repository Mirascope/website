#!/usr/bin/env python3
# Example 5: Additional Examples
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/output_parsers.mdx:165
# This file is auto-generated; any edits should be made in the source file

import json

from mirascope import llm


def only_json(response: llm.CallResponse) -> str:
    json_start = response.content.index("{") # [!code highlight]
    json_end = response.content.rfind("}") # [!code highlight]
    return response.content[json_start : json_end + 1] # [!code highlight]


@llm.call( # [!code highlight]
    provider="anthropic", model="claude-3-5-sonnet-latest", json_mode=True, output_parser=only_json # [!code highlight]
) # [!code highlight]
def json_extraction(text: str, fields: list[str]) -> str:
    return f"Extract {fields} from the following text: {text}"


json_response = json_extraction(
    text="The capital of France is Paris",
    fields=["capital", "country"],
)
print(json.loads(json_response))
