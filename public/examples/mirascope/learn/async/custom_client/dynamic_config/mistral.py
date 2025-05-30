import os

from mirascope.core import mistral, Messages
from mistralai import Mistral # [!code highlight]


@mistral.call("mistral-large-latest")
async def recommend_book(genre: str) -> mistral.MistralDynamicConfig:
    return {
        "messages": [Messages.User(f"Recommend a {genre} book")],
        "client": Mistral(api_key=os.environ["MISTRAL_API_KEY"]), # [!code highlight]
    }
