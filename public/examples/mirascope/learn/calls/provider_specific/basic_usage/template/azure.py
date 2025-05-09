from mirascope.core import azure, prompt_template

# [!code highlight:4]
@azure.call("gpt-4o-mini")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


response: azure.AzureCallResponse = recommend_book("fantasy")
print(response.content)
