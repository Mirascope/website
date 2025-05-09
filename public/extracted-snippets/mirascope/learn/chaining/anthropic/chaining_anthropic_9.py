#!/usr/bin/env python3
# Example 9: Advanced Chaining Techniques
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/chaining.mdx:293
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from pydantic import BaseModel, Field


class SummaryFeedback(BaseModel):
    """Feedback on summary with a critique and review rewrite based on said critique."""

    critique: str = Field(..., description="The critique of the summary.")
    rewritten_summary: str = Field(
        ...,
        description="A rewritten summary that takes the critique into account.",
    )


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def summarizer(original_text: str) -> str:
    return f"Summarize the following text into one sentence: {original_text}"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", response_model=SummaryFeedback)
@prompt_template(
    """
    Original Text: {original_text}
    Summary: {summary}

    Critique the summary of the original text.
    Then rewrite the summary based on the critique. It must be one sentence.
    """
)
def resummarizer(original_text: str, summary: str): ...


def rewrite_iteratively(original_text: str, summary: str, depth=2):
    text = original_text
    for _ in range(depth):
        text = resummarizer(original_text=text, summary=summary).rewritten_summary
    return text


original_text = """
In the heart of a dense forest, a boy named Timmy pitched his first tent, fumbling with the poles and pegs.
His grandfather, a seasoned camper, guided him patiently, their bond strengthening with each knot tied.
As night fell, they sat by a crackling fire, roasting marshmallows and sharing tales of old adventures.
Timmy marveled at the star-studded sky, feeling a sense of wonder he'd never known.
By morning, the forest had transformed him, instilling a love for the wild that would last a lifetime.
"""

summary = summarizer(original_text=original_text).content
print(f"Summary: {summary}")
rewritten_summary = rewrite_iteratively(original_text, summary)
print(f"Rewritten Summary: {rewritten_summary}")
