---
description: Structured collections of spans.
icon: planet-ringed
---

# Traces

> If you haven't already, we recommend reading [Spans](spans.md) first.

{% hint style="success" %}
None of the tooling below requires LLMs. It is, however, very handy when working with them.
{% endhint %}

As mentioned in the section on [nested spans](spans.md#nested-spans), traces are really just collections of spans.

In the context of observability, a "trace" often refers to a record of events in a systems execution. Generally this means capturing the inputs, outputs, and additional metadata for each function or module in your system's execution flow.

Lilypad makes this simple and easy with the `trace` decorator:

<pre class="language-python"><code class="lang-python">import lilypad

lilypad.configure()

<strong>@lilypad.trace()
</strong>def child(text: str) -> str:
    return "Child Finished!"

<strong>@lilypad.trace()
</strong>def parent(text: str) -> str:
    output = child("I'm the child!")
    print(output)
    return "Parent Finished!"
    
output = parent("I'm' the parent!")
print(output)
# > Child Finished!
# > Parent Finished!
</code></pre>

\[INSERT IMAGE]

<details>

<summary>What this might look like using <code>span</code> instead of <code>trace</code></summary>

<pre class="language-python"><code class="lang-python">from mirascope import lilypad

lilypad.configure()

def child(text: str) -> str:
    return "Child Finished!"

<strong>def parent(text: str) -> str:
</strong>    with lilypad.span("child") as child_span:
        child_input = "I'm the child!"
<strong>        child_span.metadata({"input": child_input})
</strong>        child_output = child(child_input)
<strong>        child_span.metadata({"output": child_output})
</strong>        print(child_output)
    return "Parent Finished!"

<strong>with lilypad.span("parent") as parent_span:
</strong>    parent_input = "I'm the parent!"
<strong>    parent_span.metadata({"input": parent_input})
</strong>    parent_output = parent(parent_input)
<strong>    parent_span.metadata({"output": parent_output})
</strong>    print(parent_output)
</code></pre>

As you can see, the `trace` decorator above cleans things up significantly and reduces the cognitive overhead involved in instrumenting your code.

Of course, everything works well together, and sometimes `span` makes more sense and will work better for certain use-cases where you want to instrument code that is not structured (or does not make sense to structure) as a function.

</details>

## Custom Name

By default, the `trace` decorator will use the decorated function's name for the trace. Sometimes it makes more sense to use a custom (more readable) name:

<pre class="language-python"><code class="lang-python">import lilypad

lilypad.configure()

<strong>@lilypad.trace(name="Answer Question")
</strong>def answer_question(question: str) -> str:
    return "The capital of France is Paris."
    
answer = answer_question("What is the capital of France?")
print(answer)
# > The capital of France is Paris.
</code></pre>

## Updating Trace Metadata

The `trace` decorator captures information such as inputs/outputs by default, but often you'll want to log additional information or metadata as part of that function's span (and not a sub-span).

_We've made this possible in a type-safe way with a special `trace_ctx` reserved argument name._

```python
import lilypad

lilypad.configure()

@lilypad.trace(name="Answer Question")
def answer_question(trace_ctx: lilypad.Span, question: str) -> str:
    trace_ctx.log("I'm the span for Answer Question.")
    return "The capital of France is Paris."
    
answer = answer_question("What is the capital of France?")
print(answer)
# > The capital of France is Paris.
```

If a `trace`-decorated functions has `trace_ctx: lilypad.Span` as it's first argument, the decorator will inject the span into the argument so that you can access it directly inside the function.

The resulting decorated function's call signature will then be updated such that `trace_ctx` is excluded (since `trace_ctx` will be supplied by the decorator, not the user).

Above, `answer_question` only expects `question` as an input — and your editor knows this.

## Tracing LLM Calls

{% hint style="warning" %}
Since LLMs are non-deterministic, we recommend [versioning](versioning.md) any functions that use them.
{% endhint %}

Since Lilypad can create spans for LLM API calls automatically, simple calling the API inside of a `trace`-decorated function will nest that span inside of the parent function:

<pre class="language-python"><code class="lang-python">from google.genai import Client
import lilypad

<strong>lilypad.configure(auto_llm=True)
</strong>client = Client()
   
<strong>@lilypad.trace(name="Answer Question") 
</strong>def answer_question(question: str) -> str | None:
<strong>    response = client.models.generate_content(
</strong><strong>        model="gemini-2.0-flash-001",
</strong><strong>        contents=f"Answer this question: {question}",
</strong><strong>    )
</strong>    return response.text
</code></pre>

\[INSERT IMAGE]
