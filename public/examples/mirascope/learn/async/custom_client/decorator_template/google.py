from mirascope.core import google, prompt_template # [!code highlight]


@google.call("gemini-1.5-flash")
@prompt_template("Recommend a {genre} book")
async def recommend_book_async(genre: str): ... # [!code highlight]
