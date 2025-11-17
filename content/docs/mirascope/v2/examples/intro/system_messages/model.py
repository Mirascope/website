from mirascope import llm


def recommend_book(genre: str) -> llm.Response:
    model = llm.use_model(provider="anthropic", model_id="claude-sonnet-4-0")
    return model.call(
        messages=[
            # [!code highlight]
            llm.messages.system("Always recommend kid-friendly books."),
            llm.messages.user(f"Please recommend a book in {genre}."),
        ]
    )


def main():
    response: llm.Response = recommend_book("fantasy")
    print(response.pretty())


main()
