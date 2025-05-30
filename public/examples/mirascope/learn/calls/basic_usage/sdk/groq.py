from groq import Groq

client = Groq()


def recommend_book(genre: str) -> str:
    # [!code highlight:6]
    completion = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[{"role": "user", "content": f"Recommend a {genre} book"}],
    )
    return str(completion.choices[0].message.content)


output = recommend_book("fantasy")
print(output)
