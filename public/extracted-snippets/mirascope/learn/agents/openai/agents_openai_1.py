#!/usr/bin/env python3
# Example 1: State Management
# Generated for provider: openai
# Source: content/doc/mirascope/learn/agents.mdx:47
# This file is auto-generated; any edits should be made in the source file

from mirascope import Messages, llm, BaseMessageParam
from pydantic import BaseModel


class Librarian(BaseModel):
    history: list[BaseMessageParam] = [] # [!code highlight]

    @llm.call(provider="openai", model="gpt-4o-mini")
    def _call(self, query: str) -> Messages.Type:
        return [
            Messages.System("You are a librarian"),
            *self.history, # [!code highlight]
            Messages.User(query),
        ]

    def run(self) -> None:
        while True:
            query = input("(User): ")
            if query in ["exit", "quit"]:
                break
            print("(Assistant): ", end="", flush=True)
            response = self._call(query)
            print(response.content)
            self.history += [ # [!code highlight]
                Messages.User(query), # [!code highlight]
                response.message_param, # [!code highlight]
            ] # [!code highlight]


Librarian().run()
