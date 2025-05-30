import boto3 # [!code highlight]
from mirascope.core import bedrock, prompt_template


@bedrock.call("amazon.nova-lite-v1:0")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str) -> bedrock.BedrockDynamicConfig:
    return {
        "client": boto3.client("bedrock-runtime"), # [!code highlight]
    }
