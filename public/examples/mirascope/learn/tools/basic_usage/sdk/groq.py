import json

from groq import Groq

client = Groq()


# [!code highlight:8]
def get_book_author(title: str) -> str:
    if title == "The Name of the Wind":
        return "Patrick Rothfuss"
    elif title == "Mistborn: The Final Empire":
        return "Brandon Sanderson"
    else:
        return "Unknown"


def identify_author(book: str) -> str:
    completion = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[{"role": "user", "content": f"Who wrote {book}?"}],
        # [!code highlight:15]
        tools=[
            {
                "function": {
                    "name": "get_book_author",
                    "description": "Returns the author of the book with the given title.",
                    "parameters": {
                        "properties": {"title": {"type": "string"}},
                        "required": ["title"],
                        "type": "object",
                    },
                },
                "type": "function",
            }
        ],
    )
    # [!code highlight:4]
    if tool_calls := completion.choices[0].message.tool_calls:
        if tool_calls[0].function.name == "get_book_author":
            return get_book_author(**json.loads(tool_calls[0].function.arguments))
    return str(completion.choices[0].message.content)


author = identify_author("The Name of the Wind")
print(author)
