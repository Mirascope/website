from mirascope import llm


def recommend_book(genre: str) -> llm.StreamResponse:
    model: llm.Model = llm.use_model(provider="anthropic", model_id="claude-sonnet-4-0")
    message = llm.messages.user(f"Please recommend a book in {genre}.")
    return model.stream(messages=[message])


def main():
    response: llm.StreamResponse = recommend_book("fantasy")
    for chunk in response.pretty_stream():
        print(chunk, flush=True, end="")


main()
