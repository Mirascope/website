#!/usr/bin/env python3
# Example 5: Integrating Tools
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/agents.mdx:216
# This file is auto-generated; any edits should be made in the source file

import json

from mirascope import BaseDynamicConfig, Messages, llm, BaseMessageParam
from pydantic import BaseModel


class Book(BaseModel):
    title: str
    author: str


class Librarian(BaseModel):
    history: list[BaseMessageParam] = []
    library: list[Book] = [
        Book(title="The Name of the Wind", author="Patrick Rothfuss"),
        Book(title="Mistborn: The Final Empire", author="Brandon Sanderson"),
    ]

    def _available_books(self) -> str:
        """Returns the list of books available in the library."""
        return json.dumps([book.model_dump() for book in self.library])

    @llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
    def _call(self, query: str) -> BaseDynamicConfig:
        messages = [
            Messages.System("You are a librarian"),
            *self.history,
            Messages.User(query),
        ]
        return {"messages": messages, "tools": [self._available_books]}

    def _step(self, query: str) -> str:
        if query:
            self.history.append(Messages.User(query))
        response = self._call(query)
        self.history.append(response.message_param)
        tools_and_outputs = []
        if tools := response.tools:
            for tool in tools:
                print(f"[Calling Tool '{tool._name()}' with args {tool.args}]")
                tools_and_outputs.append((tool, tool.call()))
            self.history += response.tool_message_params(tools_and_outputs)
            return self._step("")
        else:
            return response.content

    def run(self) -> None:
        while True:
            query = input("(User): ")
            if query in ["exit", "quit"]:
                break
            print("(Assistant): ", end="", flush=True)
            step_output = self._step(query)
            print(step_output)


Librarian().run()
