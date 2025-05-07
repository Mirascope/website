#!/usr/bin/env python3
# Example 1: Logfire
# Generated for provider: openai
# Source: content/docs/mirascope/integrations/logfire.mdx:20
# This file is auto-generated; any edits should be made in the source file

import logfire # [!code highlight]
from mirascope import llm
from mirascope.integrations.logfire import with_logfire # [!code highlight]
from pydantic import BaseModel

logfire.configure() # [!code highlight]


class Book(BaseModel):
    title: str
    author: str


@with_logfire() # [!code highlight]
@llm.call(provider="openai", model="gpt-4o-mini", response_model=Book)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book."


print(recommend_book("fantasy"))
