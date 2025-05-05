#!/usr/bin/env python3
# Example 3: Sending to an observability tool
# Generated for provider: anthropic
# Source: content/doc/mirascope/integrations/otel.mdx:131
# This file is auto-generated; any edits should be made in the source file

from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor,
)
from mirascope.integrations.otel import configure

OBSERVABILITY_TOOL_ENDPOINT = "..."
configure(
    processors=[
        BatchSpanProcessor(
            OTLPSpanExporter(
                endpoint=f"https://{OBSERVABILITY_TOOL_ENDPOINT}/v1/traces",
            )
        )
    ]
)
