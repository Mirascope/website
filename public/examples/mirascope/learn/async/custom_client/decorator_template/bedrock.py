import asyncio

from mirascope.core import bedrock, prompt_template
from aiobotocore.session import get_session # [!code highlight]


async def get_async_client(): # [!code highlight]
    session = get_session() # [!code highlight]
    async with session.create_client("bedrock-runtime") as client: # [!code highlight]
        return client # [!code highlight]


@bedrock.call(
    "anthropic.claude-3-haiku-20240307-v1:0", client=asyncio.run(get_async_client()) # [!code highlight]
)
@prompt_template("Recommend a {genre} book")
async def recommend_book_async(genre: str): ...
