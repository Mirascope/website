---
description: Easily instrument arbitrary blocks of code with OpenTelemetry.
icon: sparkle
---

# Spans

> If you haven't already, we recommend reading [OpenTelemetry](opentelemetry.md) first.&#x20;

{% hint style="success" %}
None of the tooling below requires LLMs. It is, however, very handy when working with them.
{% endhint %}

Lilypad implements a `span` context manager that makes it easy to instrument a block of code:

<pre class="language-python"><code class="lang-python">import lilypad

lilypad.configure()

<strong>with lilypad.span("Something") as span:
</strong>    # do something
<strong>    span.log("Did something...")
</strong></code></pre>

This will automatically capture information such as the latency of the code run within the span, including any calls to `log` that you make inside of the block.

\[INSERT IMAGE]

## Logging Levels

The `span` context manager provides additional convenience methods for common logging levels:

* `log` — alias for the `info` method.
* `info` — log an informational message.
* `debug` — log a debug message.
* `warning` — log a warning message.
* `error` — log an error message.
* `critical` — log a critical message.

For example, you may want to catch and log and exception:

<pre class="language-python"><code class="lang-python">import lilypad

lilypad.configure()

with lilypad.span("Possible Failure") as span:
    try:
        # do something that could error
        raise RuntimeError("For testing.")
    except RuntimeError as e:
<strong>        span.error(f"Runtime exception caught: {e}")
</strong></code></pre>

\[INSERT IMAGE]

## Metadata

You can also capture arbitrary structured metadata:

<pre class="language-python"><code class="lang-python">import lilypad

lilypad.configure()

with lilypad.span("Structured Metadata") as span:
<strong>    span.metadata({"key": "value"})
</strong></code></pre>

\[INSERT IMAGE]

Calling `metadata` multiple times will merge the dictionaries.

## Nested Spans

Lilypad will properly capture nested spans as what we call [Traces](traces.md), which are really just a collection of nested spans that share a single common parent.

<pre class="language-python"><code class="lang-python">import lilypad

lilypad.configure()

<strong>with lilypad.span("Parent Span") as parent_span:
</strong>    parent_span.log("I'm the parent!")
<strong>    with lilypad.span("Child span") as child_span:
</strong>        child_span.log("I'm the child!")
</code></pre>

The project home page will only display the parent in each row. You can click the dropdown to view the entire collection of spans contained within that trace:

\[INSERT IMAGE]
