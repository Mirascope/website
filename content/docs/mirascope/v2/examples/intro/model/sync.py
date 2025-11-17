from mirascope import llm


def recommend_book(genre: str) -> llm.Response:
    model: llm.Model = llm.use_model(provider="anthropic", model_id="claude-sonnet-4-0")
    message = llm.messages.user(f"Please recommend a book in {genre}.")
    return model.call(messages=[message])


def main():
    response: llm.Response = recommend_book("fantasy")
    print(response.pretty())


main()
