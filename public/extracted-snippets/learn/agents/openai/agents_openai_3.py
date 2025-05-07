#!/usr/bin/env python3
# Example 3: State Management
# Generated for provider: openai
# Source: content/docs/mirascope/learn/agents.mdx:129
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseMessageParam, Messages, llm
from pydantic import BaseModel


class Librarian(BaseModel):
    history: list[BaseMessageParam] = []

    @llm.call(provider="openai", model="gpt-4o-mini")
    def _call(self, query: str) -> Messages.Type:
        return [
            Messages.System("You are a librarian"),
            *self.history,
            Messages.User(query),
        ]

    def run(
        self,
        provider: llm.Provider, # [!code highlight]
        model: str, # [!code highlight]
    ) -> None:
        while True:
            query = input("(User): ")
            if query in ["exit", "quit"]:
                break
            print("(Assistant): ", end="", flush=True)
            response = llm.override(self._call, provider=provider, model=model)(query) # [!code highlight]
            print(response.content)
            self.history += [
                response.user_message_param,
                response.message_param,
            ]


Librarian().run("anthropic", "claude-3-5-sonnet-latest")
