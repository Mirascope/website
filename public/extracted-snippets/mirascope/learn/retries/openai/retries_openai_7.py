#!/usr/bin/env python3
# Example 7: Error Reinsertion
# Generated for provider: openai
# Source: content/doc/mirascope/learn/retries.mdx:226
# This file is auto-generated; any edits should be made in the source file

from typing import Annotated

from mirascope import llm
from mirascope.retries.tenacity import collect_errors # [!code highlight]
from pydantic import AfterValidator, ValidationError
from tenacity import retry, stop_after_attempt


def is_upper(v: str) -> str:
    assert v.isupper(), "Must be uppercase"
    return v


@retry(stop=stop_after_attempt(3), after=collect_errors(ValidationError)) # [!code highlight]
@llm.call(
    provider="openai",
    model="gpt-4o-mini",
    response_model=Annotated[str, AfterValidator(is_upper)],  # pyright: ignore [reportArgumentType, reportCallIssue]
)
def identify_author(book: str, *, errors: list[ValidationError] | None = None) -> str: # [!code highlight]
    previous_errors = None
    if errors:
        print(previous_errors)
        return f"Previous Error: {errors}\n\nWho wrote {book}?"
    return f"Who wrote {book}?"


author = identify_author("The Name of the Wind")
print(author)
# Previous Errors: [1 validation error for str
# value
#   Assertion failed, Must be uppercase [type=assertion_error, input_value='Patrick Rothfuss', input_type=str]
#     For further information visit https://errors.pydantic.dev/2.7/v/assertion_error]
# PATRICK ROTHFUSS
