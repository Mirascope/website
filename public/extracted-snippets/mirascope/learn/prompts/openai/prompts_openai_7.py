#!/usr/bin/env python3
# Example 7: Output: [BaseMessageParam(role='user', content='Recommend a fantasy book.\nOutput in the format Title by Author.')]
# Generated for provider: openai
# This file is auto-generated and should not be edited directly

from mirascope import prompt_template

# BAD
@prompt_template(
    """
    USER: First line
    Second line
    """
)
def bad_template(params): ...

# GOOD
@prompt_template(
    """
    USER:
    First line
    Second line
    """
)
def good_template(params): ...
