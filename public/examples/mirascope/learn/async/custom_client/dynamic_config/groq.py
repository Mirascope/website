from groq import AsyncGroq # [!code highlight]
from mirascope.core import groq, Messages


@groq.call("llama-3.1-70b-versatile")
async def recommend_book(genre: str) -> groq.AsyncGroqDynamicConfig:
    return {
        "messages": [Messages.User(f"Recommend a {genre} book")],
        "client": AsyncGroq(), # [!code highlight]
    }
