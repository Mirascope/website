#!/usr/bin/env python3
# Example 6: Hardcoded Evaluation Criteria
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/evals.mdx:296
# This file is auto-generated; any edits should be made in the source file

def calculate_recall_precision(output: str, expected: str) -> tuple[float, float]:
    output_words = set(output.lower().split())
    expected_words = set(expected.lower().split())

    common_words = output_words.intersection(expected_words)

    recall = len(common_words) / len(expected_words) if expected_words else 0 # [!code highlight]
    precision = len(common_words) / len(output_words) if output_words else 0 # [!code highlight]

    return recall, precision


# Example usage
output = "The Eiffel Tower is a famous landmark in Paris, France."
expected = (
    "The Eiffel Tower, located in Paris, is an iron lattice tower on the Champ de Mars."
)
recall, precision = calculate_recall_precision(output, expected)
print(f"Recall: {recall:.2f}, Precision: {precision:.2f}")
# Output: Recall: 0.40, Precision: 0.60
