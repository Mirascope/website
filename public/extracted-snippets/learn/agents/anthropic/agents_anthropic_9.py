#!/usr/bin/env python3
# Example 9: Streaming
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/agents.mdx:494
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

    @llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", stream=True) # [!code highlight]
    def _stream(self, query: str) -> BaseDynamicConfig: # [!code highlight]
        messages = [
            Messages.System("You are a librarian"),
            *self.history,
            Messages.User(query),
        ]
        return {"messages": messages, "tools": [self._available_books]}

    def _step(self, query: str) -> None:
        if query:
            self.history.append(Messages.User(query))
        stream = self._stream(query) # [!code highlight]
        tools_and_outputs = [] # [!code highlight]
        for chunk, tool in stream: # [!code highlight]
            if tool: # [!code highlight]
                print(f"[Calling Tool '{tool._name()}' with args {tool.args}]") # [!code highlight]
                tools_and_outputs.append((tool, tool.call())) # [!code highlight]
            else: # [!code highlight]
                print(chunk.content, end="", flush=True) # [!code highlight]
        self.history.append(stream.message_param) # [!code highlight]
        if tools_and_outputs: # [!code highlight]
            self.history += stream.tool_message_params(tools_and_outputs) # [!code highlight]
            self._step("") # [!code highlight]

    def run(self) -> None:
        while True:
            query = input("(User): ")
            if query in ["exit", "quit"]:
                break
            print("(Assistant): ", end="", flush=True)
            self._step(query)
            print()


Librarian().run()
