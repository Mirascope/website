#!/usr/bin/env python3
# Example 5: Additional Examples
# Generated for provider: openai
# Source: content/doc/mirascope/learn/output_parsers.mdx:163
# This file is auto-generated; any edits should be made in the source file

import json

from mirascope import llm


def only_json(response: llm.CallResponse) -> str:
    json_start = response.content.index("{")
    json_end = response.content.rfind("}")
    return response.content[json_start : json_end + 1]


@llm.call(
    provider="openai", model="gpt-4o-mini", json_mode=True, output_parser=only_json
)
def json_extraction(text: str, fields: list[str]) -> str:
    return f"Extract {fields} from the following text: {text}"


json_response = json_extraction(
    text="The capital of France is Paris",
    fields=["capital", "country"],
)
print(json.loads(json_response))
