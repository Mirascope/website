---
description: This guide will have you up and running with Lilypad in less than 5 minutes.
icon: forward
---

# Quickstart

## Create an account

> You’ll need a GitHub or Google account to sign up.

First, navigate to [https://lilypad.mirascope.com](https://lilypad.mirascope.com) and create an account.

<details>

<summary><strong>Would you rather start with a no-code playground?</strong></summary>

Check out the [Playground](playground.md) section to get started running and experimenting right in the UI.

</details>

## Environment Variables

Navigate to [Settings -> Organization](https://lilypad.mirascope.com/settings/org) and:

1. Create a new project.
2. Generate an API key for that project.

We recommend saving the ID and API key in your environment (e.g. `export` or `.env` file):

```bash
LILYPAD_PROJECT_ID=...
LILYPAD_API_KEY=...
```

If using a `.env` file, remember to use something like [`load_dotenv()`](https://github.com/theskumar/python-dotenv) so they are properly loaded.

### LLM API Key

You'll need to set the API key for the provider you're using in your environment.

We recommend creating one in [Google AI Studio](https://aistudio.google.com/apikey) if you don't have one yet.

They have a very generous free tier.

## Installation

Install the `lilypad-sdk` with any additional dependencies you may need:

{% tabs %}
{% tab title="uv" %}
```bash
# For spans / tracing
uv add lilypad-sdk

# For Google Gemini/Vertex support
uv add "lilypad-sdk[google]"

# For multiple providers
uv add "lilypad-sdk[google,openai,anthropic]"
```
{% endtab %}

{% tab title="pip" %}
```bash
# For spans / tracing
pip install lilypad-sdk

# For OpenAI support
pip install "lilypad-sdk[openai]"

# For multiple providers
pip install "lilypad-sdk[openai,anthropic,google]"
```
{% endtab %}
{% endtabs %}

Available provider extras:

* `google` - Google Gemini/Vertex models (`genai` SDK)
* `openai` - OpenAI models
* `anthropic` - Anthropic models
* `bedrock` - AWS Bedrock models
* `azure` - Azure AI models
* `mistral` - Mistral models
* `outlines` - Outlines framework

## Automatically Trace & Version

Run your first automatically [traced](../observability/traces.md) and [versioned](../observability/versioning.md) function:

{% tabs %}
{% tab title="Google" %}
<pre class="language-python"><code class="lang-python">from google.genai import Client
<strong>import lilypad
</strong>
<strong>lilypad.configure()
</strong>client = Client()

<strong>@lilypad.trace(versioning="automatic")
</strong>def answer_question(question: str) -> str | None:
    response = client.models.generate_content(
        model="gemini-2.0-flash-001",
        contents=f"Answer this question: {question}",
    )
    return response.text
    
response = answer_question("What is the capital of France?")
print(response)
# > The capital of France is Paris.
</code></pre>
{% endtab %}

{% tab title="OpenAI" %}
<pre class="language-python"><code class="lang-python"><strong>import lilypad
</strong>from openai import OpenAI

<strong>lilypad.configure()
</strong>client = OpenAI()

<strong>@lilypad.trace(versioning="automatic")
</strong>def answer_question(question: str) -> str | None:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": f"Answer this question: {question}"}],
    )
    return response.choices[0].message.content
    
response = answer_question("What is the capital of France?")
print(response)
# > The capital of France is Paris.
</code></pre>
{% endtab %}

{% tab title="Anthropic" %}
<pre class="language-python"><code class="lang-python">from anthropic import Anthropic
<strong>import lilypad
</strong>
<strong>lilypad.configure()
</strong>client = Anthropic()

<strong>@lilypad.trace(versioning="automatic")
</strong>def answer_question(question: str) -> str | None:
    response = client.messages.create(
        model="claude-3-7-sonnet-latest",
        messages=[{"role": "user", "content": f"Answer this question: {question}"}],
        max_tokens=1024,
    )
    content = response.content[0]
    return content.text if content.type == "text" else None
    
response = answer_question("What is the capital of France?")
print(response)
# > The capital of France is Paris.
</code></pre>
{% endtab %}

{% tab title="Mistral" %}
<pre class="language-python"><code class="lang-python">import os

<strong>import lilypad
</strong>from mistralai import Mistral

<strong>lilypad.configure()
</strong>client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])

<strong>@lilypad.trace(versioning="automatic")
</strong>def answer_question(question: str) -> str | None:
    response = client.chat.complete(
        model="mistral-small-latest",
        messages=[{"role": "user", "content": f"Answer this question: {question}"}],
    )
    return response.choices[0].message.content
    
response = answer_question("What is the capital of France?")
print(response)
# > The capital of France is Paris.
</code></pre>
{% endtab %}

{% tab title="Bedrock" %}
<pre class="language-python"><code class="lang-python">import os

from boto3.session import Session
<strong>import lilypad
</strong>
<strong>lilypad.configure()
</strong>session = Session()
client = session.client("bedrock-runtime")

<strong>@lilypad.trace(versioning="automatic")
</strong>def answer_question(question: str) -> str | None:
    response = client.converse(
        modelId="anthropic.claude-3-haiku-20240307-v1:0",
        messages=[
            {"role": "user", "content": [{"text": f"Answer this question: {question}"}]}
        ],
    )
    return response["output"]["message"]["content"][0]["text"]

response = answer_question("What is the capital of France?")
print(response)
# > The capital of France is Paris.
</code></pre>
{% endtab %}

{% tab title="Azure" %}
<pre class="language-python"><code class="lang-python">from azure.ai.inference import ChatCompletionsClient
from azure.core.credentials import AzureKeyCredential
<strong>import lilypad
</strong>
<strong>lilypad.configure()
</strong>client = ChatCompletionsClient(
    endpoint="https://your-endpoint.openai.azure.com/openai/deployments/gpt-4o-mini",
    credential=AzureKeyCredential(key="..."),
)

<strong>@lilypad.trace(versioning="automatic")
</strong>def answer_question(question: str) -> str | None:
    response = client.complete(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": f"Answer this question: {question}"}],
    )
    return response.choices[0].message.content
    
response = answer_question("What is the capital of France?")
print(response)
# > The capital of France is Paris.
</code></pre>
{% endtab %}

{% tab title="Outlines" %}
<pre class="language-python"><code class="lang-python"><strong>import lilypad
</strong>import outlines

<strong>lilypad.configure()
</strong>
<strong>@lilypad.trace(versioning="automatic")
</strong>def answer_question(question: str) -> str | None:
    model = outlines.models.transformers(
        "microsoft/Phi-3-mini-4k-instruct",
        device="cuda"  # optional device argument, default is cpu
    )
    generator = outlines.generate.text(model)
    response = generator(f"Answer this question: {question}")
    return response

response = answer_question("What is the capital of France?")
print(response)
# > The capital of France is Paris.
</code></pre>
{% endtab %}
{% endtabs %}

Follow the link output in your terminal to view the captured version and corresponding trace.

See the [observability](broken-reference) section to learn more.

## Look At Your Data!

Go build and run some LLM functions and inspect their results using Lilypad.

While you're at it, try [annotating](../evaluation/annotations.md) some data too.
