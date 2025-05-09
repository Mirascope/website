from mirascope.core import openai, prompt_template

# [!code highlight:4]
@openai.call("gpt-4o-mini")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


response: openai.OpenAICallResponse = recommend_book("fantasy")
print(response.content)
