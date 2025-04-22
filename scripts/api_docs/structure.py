"""Directory structure extraction for API documentation.

This module provides a simple way to extract file structure from the source
repository and organize it by directory for API documentation generation.
"""

from collections import defaultdict
from pathlib import Path


def organize_api_files(api_docs_path: Path) -> dict[str, list[Path]]:
    """Organize API documentation files by directory.

    This function scans all files in the API docs directory and organizes them
    by their parent directory for easier processing.

    Args:
        api_docs_path: Path to the API docs directory

    Returns:
        A dictionary where keys are directory names (empty string for root) and
        values are lists of file paths relative to the api_docs_path

    """
    if not api_docs_path.exists():
        raise ValueError(f"API docs directory not found at {api_docs_path}")

    # Use defaultdict to automatically create empty lists for new keys
    organized_files = defaultdict(list)

    # Find all .md and .mdx files
    for file_path in api_docs_path.glob("**/*.md*"):
        # Skip directories
        if file_path.is_dir():
            continue

        # Get the relative path
        rel_path = file_path.relative_to(api_docs_path)

        # Get the parent directory (or empty string for root)
        parent = str(rel_path.parent)
        if parent == ".":
            parent = ""

        # Add the file to the appropriate directory
        organized_files[parent].append(rel_path)

    return dict(organized_files)  # Convert back to regular dict before returning
