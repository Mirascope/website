---
description: Welcome to the Lilypad documentation! We're excited you're here.
icon: hand-wave
---

# Welcome

<details>

<summary>Why Lilypad (we think you should read this)</summary>

When building with LLMs, a typical development flow might look like this:

1. [**Prototype**](./#id-1.-prototype) — make sure everything is functional
2. [**Vibe Check**](./#id-2.-vibe-check) — gut feeling should be "good enough"
3. [**Annotate**](./#id-3.-annotate) — systematically label the data you look at
4. [**Analyze**](./#id-4.-analyze) — understand where and why the system is failing
5. [**Optimize**](./#id-5.-optimize) — apply your learnings to improve the system (e.g. your prompt)
6. [**Iterate**](./#id-6.-iterate) — repeat steps 3-5 (forever, or at least until it's "good enough")

Let's break each of these steps down further.

## 1. Prototype

The first and most important step is simply getting started.

We recommend taking a look at our open-source LLM library [`mirascope`](https://mirascope.com) , which we've purpose built to make both prototyping and the steps that follow simple, easy, and elegant.

For the remaining sections, let's use a simple LLM call as an example:

```python
from mirascope import llm

@llm.call(
    provider="openai",
    model="gpt-4o",
)
def answer_question(question: str) -> str:
    return f"Answer this question: {question}"
    
response = answer_question("What is the capital of France?")
print(response.content)
# > The capital of France is Paris.
```

We're using the `@llm.call()` decorator to turn the `answer_question` function into an LLM API call.

## 2. Vibe Check

How do we feel about "The capital of France is Paris." as the answer to our question?

Let's say our gut feeling is "not good enough" because we want a single word answer, so we update our prompt to make this more clear:

<pre class="language-python"><code class="lang-python">from mirascope import llm

@llm.call(
    provider="openai",
    model="gpt-4o",
)
def answer_question(question: str) -> str:
<strong>    return f"Answer this question in one word: {question}"
</strong>    
response = answer_question("What is the capital of France?")
print(response.content)
<strong># > Paris
</strong></code></pre>

Oops, we forgot to commit our previous prompt.

For a simple example this might not seems like a big deal, but LLMs are fickle. What if the prompt we just lost happened to be the one that would've performed the best, and now you can't replicate it.

Not good.

This is the point at which most people reach for observability tooling. This is _almost_ the right choice.

The issue is that today's observability tooling was not built for the LLM era. It was built for deterministic software, but LLMs are non-deterministic.

You need more than just observability — you need to build a data flywheel.

This requires:

1. Some place to put your data
2. Some place to see / query / etc. that data
3. Some way to annotate that data
4. Some way to track / version artifacts (so you can compare performance over time)

Current observability tools provide 1 and 2 but not 3 or 4, which are critical.

**Lilypad provides all four** — _in just two lines of code._

<pre class="language-python" data-full-width="false"><code class="lang-python">import lilypad
from mirascope import llm

<strong>lilypad.configure(auto_llm=True)  # automatically version and trace LLM API calls
</strong>
<strong>@lilypad.trace(versioning="automatic")
</strong>@llm.call(
    provider="openai",
    model="gpt-4o",
)
def answer_question(question: str) -> str:
    return f"Answer this question in one word: {question}"
    
response = answer_question("What is the capital of France?")
print(response.content)
# > Paris
</code></pre>

\[INSERT IMAGE]

Check out the [Versioning](observability/versioning.md) section for more information.

## 3. Annotate

The next step is to look at real (or synthetic) data and systematically label it.

\[INSERT IMAGE]

With Lilypad, you annotate the data right where you look at it. This makes it seamless.

It's also extremely important that we annotate not just the inputs/outputs but also everything about the trace. This includes the code, the prompt, the call parameters, the cost, the latency — everything you might need to know if you'd consider it "good enough" or not.

## 4. Analyze

Once you've annotated enough data, it's time to look for trends — common failure points.

Compare outputs from different versions on the same input. Did the changes help?

\[INSERT IMAGE]

Distilling your annotations into action items makes for much easier optimization.

## 5. Optimize

Now we can apply our analysis and update the system to improve it.

For example, we could identify the most common point of failure and work to resolve that first. Consider our earlier example. We could have identified that there were a lot of longer answers and we really want single word answers. So we added "in one word" to the prompt and ran it again.

This step is just the more advanced and systematic version of that.

This is also often the stage where developers realize they need to involve domain experts who can properly annotate, analyze, and optimize their prompts. And for the first time ever, non-technical team members need to be involved in the writing of the actual software itself.

Check out the Managed Generations section for more information on how Lilypad helps.

## 6. Iterate

Part of the optimization process involves making changes — a new version.

All we have to do is repeat steps 3 through 5 until we deem the system "good enough".

</details>

## Getting Started

<table data-view="cards"><thead><tr><th data-type="content-ref"></th></tr></thead><tbody><tr><td><a href="getting-started/quickstart.md">quickstart.md</a></td></tr><tr><td><a href="getting-started/open-source.md">open-source.md</a></td></tr><tr><td><a href="getting-started/playground.md">playground.md</a></td></tr></tbody></table>

## Observability

<table data-view="cards"><thead><tr><th data-type="content-ref"></th></tr></thead><tbody><tr><td><a href="observability/spans.md">spans.md</a></td></tr><tr><td><a href="observability/traces.md">traces.md</a></td></tr><tr><td><a href="observability/versioning.md">versioning.md</a></td></tr></tbody></table>

## Evaluation

<table data-view="cards"><thead><tr><th data-type="content-ref"></th></tr></thead><tbody><tr><td><a href="evaluation/cost-and-latency-tracking.md">cost-and-latency-tracking.md</a></td></tr><tr><td><a href="evaluation/comparisons.md">comparisons.md</a></td></tr><tr><td><a href="evaluation/annotations.md">annotations.md</a></td></tr></tbody></table>
