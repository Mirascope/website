#!/usr/bin/env python3
# Example 13: Few-Shot Examples
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/response_models.mdx:574
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from pydantic import BaseModel, ConfigDict, Field


class Book(BaseModel):
    title: str = Field(..., examples=["THE NAME OF THE WIND"]) # [!code highlight]
    author: str = Field(..., examples=["Rothfuss, Patrick"]) # [!code highlight]

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [ # [!code highlight]
                {"title": "THE NAME OF THE WIND", "author": "Rothfuss, Patrick"} # [!code highlight]
            ] # [!code highlight]
        }
    )


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", response_model=Book, json_mode=True)
def extract_book(text: str) -> str:
    return f"Extract {text}. Match example format EXCLUDING 'examples' key."


book = extract_book("The Way of Kings by Brandon Sanderson")
print(book)
# Output: title='THE WAY OF KINGS' author='Sanderson, Brandon'
