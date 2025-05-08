#!/usr/bin/env python3
# Example 7: Multi-Line Prompts
# Generated for provider: openai
# Source: content/docs/mirascope/learn/prompts.mdx:183
# This file is auto-generated; any edits should be made in the source file

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
