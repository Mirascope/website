from cohere import Client
from mirascope.core import cohere # [!code highlight]


@cohere.call("command-r-plus", client=Client()) # [!code highlight]
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"
