#!/usr/bin/env python3
# Example 7: Hardcoded Evaluation Criteria
# Generated for provider: openai
# Source: src/docs/mirascope/learn/evals.mdx:317
# This file is auto-generated; any edits should be made in the source file

import re


def contains_email(output: str) -> bool:
    email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    return bool(re.search(email_pattern, output))


# Example usage
output = "My email is john.doe@example.com"
print(contains_email(output))
# Output: True
