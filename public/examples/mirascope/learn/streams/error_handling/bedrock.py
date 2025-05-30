from mirascope.core import bedrock # [!code highlight]
from botocore.exceptions import ClientError


@bedrock.call(model="anthropic.claude-3-haiku-20240307-v1:0", stream=True)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


try: # [!code highlight]
    for chunk, _ in recommend_book("fantasy"):
        print(chunk.content, end="", flush=True)
except ClientError as e: # [!code highlight]
    print(f"Error: {str(e)}")
