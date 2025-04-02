from mirascope import llm
from pydantic import BaseModel


class Book(BaseModel):
    """An extracted book."""
 
    title: str
    author: str


@llm.call(provider="$PROVIDER_NAME", model="$PROVIDER_MODEL", response_model=Book)
def extract_book(text: str) -> str:
    return f"Extract {text}"


book: Book = extract_book("The Name of the Wind by Patrick Rothfuss")
print(book)
# Output: title='The Name of the Wind' author='Patrick Rothfuss'