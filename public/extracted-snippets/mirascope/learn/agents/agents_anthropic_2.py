#!/usr/bin/env python3
# Example 2: State Management
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/agents.mdx:80
# This file is auto-generated; any edits should be made in the source file

from mirascope import Messages, llm, BaseMessageParam, prompt_template
from pydantic import BaseModel


class Librarian(BaseModel):
    history: list[BaseMessageParam] = []

    @llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
    @prompt_template(
        """
        SYSTEM: You are a librarian
        MESSAGES: {self.history}
        USER: {query}
        """
    )
    def _call(self, query: str): ...

    def run(self) -> None:
        while True:
            query = input("(User): ")
            if query in ["exit", "quit"]:
                break
            print("(Assistant): ", end="", flush=True)
            response = self._call(query)
            print(response.content)
            self.history += [
                Messages.User(query),
                response.message_param,
            ]


Librarian().run()
