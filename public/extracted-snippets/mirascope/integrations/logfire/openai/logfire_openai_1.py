#!/usr/bin/env python3
# Example 1: Logfire
# Generated for provider: openai
# Source: src/docs/mirascope/integrations/logfire.mdx:19
# This file is auto-generated; any edits should be made in the source file

import logfire
from mirascope import llm
from mirascope.integrations.logfire import with_logfire
from pydantic import BaseModel

logfire.configure()


class Book(BaseModel):
    title: str
    author: str


@with_logfire()
@llm.call(provider="openai", model="gpt-4o-mini", response_model=Book)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book."


print(recommend_book("fantasy"))
