#!/usr/bin/env python3
# Example 8: Human-In-The-Loop
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/agents.mdx:423
# This file is auto-generated; any edits should be made in the source file

from mirascope import (
    BaseDynamicConfig,
    Messages,
    llm,
    BaseMessageParam,
    prompt_template,
)
from pydantic import BaseModel


class Librarian(BaseModel):
    history: list[BaseMessageParam] = []

    def _ask_for_help(self, question: str) -> str: # [!code highlight]
        """Asks for help from an expert.""" # [!code highlight]
        print("[Assistant Needs Help]") # [!code highlight]
        print(f"[QUESTION]: {question}") # [!code highlight]
        answer = input("[ANSWER]: ") # [!code highlight]
        print("[End Help]") # [!code highlight]
        return answer # [!code highlight]

    @llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
    @prompt_template(
        """
        SYSTEM: You are a librarian
        MESSAGES: {self.history}
        USER: {query}
        """
    )
    def _call(self, query: str) -> BaseDynamicConfig:
        return {"tools": [self._ask_for_help]} # [!code highlight]

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
