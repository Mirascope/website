import boto3

bedrock_client = boto3.client(service_name="bedrock-runtime")


def recommend_book(genre: str) -> str:
     # [!code highlight:13]
    messages = [{"role": "user", "content": [{"text": f"Recommend a {genre} book"}]}]
    response = bedrock_client.converse(
        modelId="amazon.nova-lite-v1:0",
        messages=messages, # pyright: ignore
        inferenceConfig={"maxTokens": 1024},
    )
    output_message = response["output"]["message"] # pyright: ignore
    content = ""
    for content_piece in output_message["content"]:
        if "text" in content_piece:
            content += content_piece["text"]
    return content


output = recommend_book("fantasy")
print(output)