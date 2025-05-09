from groq import Groq # [!code highlight]
from mirascope.core import groq, Messages


@groq.call("llama-3.1-70b-versatile")
def recommend_book(genre: str) -> groq.GroqDynamicConfig:
    return {
        "messages": [Messages.User(f"Recommend a {genre} book")],
        "client": Groq(), # [!code highlight]
    }
