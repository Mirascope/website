from mirascope import llm


@llm.call(
    provider="anthropic",
    model_id="claude-sonnet-4-0",
    temperature=1,  # [!code highlight]
)
def recommend_book(genre: str):
    return f"Please recommend a book in {genre}."


def main():
    response: llm.Response = recommend_book("fantasy")
    print(response.pretty())


main()
