#!/usr/bin/env python3
# Example 6: Integrating Tools
# Generated for provider: openai
# Source: content/doc/mirascope/learn/agents.mdx:278
# This file is auto-generated; any edits should be made in the source file

import json

from mirascope import (
    BaseDynamicConfig,
    Messages,
    llm,
    BaseMessageParam,
    prompt_template,
)
from pydantic import BaseModel


class Book(BaseModel):
    title: str
    author: str


class Librarian(BaseModel):
    history: list[BaseMessageParam] = []
    library: list[Book] = [ # [!code highlight]
        Book(title="The Name of the Wind", author="Patrick Rothfuss"), # [!code highlight]
        Book(title="Mistborn: The Final Empire", author="Brandon Sanderson"), # [!code highlight]
    ] # [!code highlight]

    def _available_books(self) -> str: # [!code highlight]
        """Returns the list of books available in the library.""" # [!code highlight]
        return json.dumps([book.model_dump() for book in self.library]) # [!code highlight]

    @llm.call(provider="openai", model="gpt-4o-mini")
    @prompt_template(
        """
        SYSTEM: You are a librarian
        MESSAGES: {self.history}
        USER: {query}
        """
    )
    def _call(self, query: str) -> BaseDynamicConfig:
        return {"tools": [self._available_books]} # [!code highlight]

    def _step(self, query: str) -> str:
        if query:
            self.history.append(Messages.User(query))
        response = self._call(query)
        self.history.append(response.message_param)
        tools_and_outputs = [] # [!code highlight]
        if tools := response.tools: # [!code highlight]
            for tool in tools: # [!code highlight]
                print(f"[Calling Tool '{tool._name()}' with args {tool.args}]") # [!code highlight]
                tools_and_outputs.append((tool, tool.call())) # [!code highlight]
            self.history += response.tool_message_params(tools_and_outputs) # [!code highlight]
            return self._step("") # [!code highlight]
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
