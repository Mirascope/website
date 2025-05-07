#!/usr/bin/env python3
# Example 4: State Management
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/agents.mdx:167
# This file is auto-generated; any edits should be made in the source file

from mirascope import BaseMessageParam, llm, prompt_template
from pydantic import BaseModel


class Librarian(BaseModel):
    history: list[BaseMessageParam] = []

    @llm.call(provider="anthropic", model="claude-3-5-sonnet-latest") # [!code highlight]
    @prompt_template(
        """
        SYSTEM: You are a librarian
        MESSAGES: {self.history}
        USER: {query}
        """
    )
    def _call(self, query: str): ...

    def run(
        self,
        provider: llm.Provider,
        model: str,
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
