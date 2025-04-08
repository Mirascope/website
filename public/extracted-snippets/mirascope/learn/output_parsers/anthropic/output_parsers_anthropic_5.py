#!/usr/bin/env python3
# Example 5: Additional Examples
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

import json

from mirascope import llm


def only_json(response: llm.CallResponse) -> str:
    json_start = response.content.index("{")
    json_end = response.content.rfind("}")
    return response.content[json_start : json_end + 1]


@llm.call(
    provider="anthropic", model="claude-3-5-sonnet-latest", json_mode=True, output_parser=only_json
)
def json_extraction(text: str, fields: list[str]) -> str:
    return f"Extract {fields} from the following text: {text}"


json_response = json_extraction(
    text="The capital of France is Paris",
    fields=["capital", "country"],
)
print(json.loads(json_response))
