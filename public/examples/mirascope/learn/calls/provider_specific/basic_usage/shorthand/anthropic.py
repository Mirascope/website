from mirascope.core import anthropic

# [!code highlight:4]
@anthropic.call("claude-3-5-sonnet-latest")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


response: anthropic.AnthropicCallResponse = recommend_book("fantasy")
print(response.content)
