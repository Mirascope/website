from xai import Xai

client = Xai()


def recommend_book(genre: str) -> str:
    completion = client.chat.completions.create(
        model="grok-3",
        messages=[{"role": "user", "content": f"Recommend a {genre} book"}],
    )
    return str(completion.choices[0].message.content)


output = recommend_book("fantasy")
print(output)