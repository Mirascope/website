import boto3

bedrock_client = boto3.client(service_name="bedrock-runtime")


def recommend_book(genre: str) -> str:
    # This example is simplified and might not match the exact Bedrock API
    # For demonstration purposes only
    try:
        # Simple message structure for Bedrock
        response = bedrock_client.invoke_model(
            modelId="anthropic.claude-v2",
            body=f"Recommend a {genre} book",
        )
        return response.get("body", "").read().decode()
    except Exception as e:
        print(f"Error calling Bedrock: {e}")
        return ""


output = recommend_book("fantasy")
print(output)
