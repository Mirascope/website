from mirascope.core import mistral

# [!code highlight:4]
@mistral.call("mistral-large-latest")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


response: mistral.MistralCallResponse = recommend_book("fantasy")
print(response.content)
