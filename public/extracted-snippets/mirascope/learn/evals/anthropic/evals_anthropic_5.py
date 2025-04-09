#!/usr/bin/env python3
# Example 5: Hardcoded Evaluation Criteria
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/evals.mdx:280
# This file is auto-generated; any edits should be made in the source file

def exact_match_eval(output: str, expected: list[str]) -> bool:
    return all(phrase in output for phrase in expected)


# Example usage
output = "The capital of France is Paris, and it's known for the Eiffel Tower."
expected = ["capital of France", "Paris", "Eiffel Tower"]
result = exact_match_eval(output, expected)
print(result)  # Output: True
