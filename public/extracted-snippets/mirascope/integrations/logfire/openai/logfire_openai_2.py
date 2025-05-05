#!/usr/bin/env python3
# Example 2: Logfire
# Generated for provider: openai
# Source: content/doc/mirascope/integrations/logfire.mdx:45
# This file is auto-generated; any edits should be made in the source file

import logfire # [!code highlight]
from mirascope import llm, prompt_template
from mirascope.integrations.logfire import with_logfire # [!code highlight]
from pydantic import BaseModel

logfire.configure() # [!code highlight]


class Book(BaseModel):
    title: str
    author: str


@with_logfire() # [!code highlight]
@llm.call(provider="openai", model="gpt-4o-mini", response_model=Book)
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


print(recommend_book("fantasy"))
