from mirascope import llm, prompt_template
from pydantic import BaseModel


class Book(BaseModel):
    title: str
    author: str


@llm.call(provider="$PROVIDER_NAME", model="$PROVIDER_MODEL", response_model=Book)
@prompt_template("Extract {text}")
def extract_book(text: str): ...


book: Book = extract_book("The Name of the Wind by Patrick Rothfuss")
print(book)
# Output: title='The Name of the Wind' author='Patrick Rothfuss'