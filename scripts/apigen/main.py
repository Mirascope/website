#!/usr/bin/env python3
"""Regenerate API documentation for Mirascope.

This script:
1. Clones/updates the Mirascope repository at the version specified in pyproject.toml
2. Extracts the API documentation structure
3. Generates MDX files with API documentation based on autodoc directives using Griffe

Usage:
  - `bun run apigen`: Regenerate all API documentation
  - `bun run apigen pattern`: Regenerate only files matching the pattern
"""

import argparse
import os
import re
import sys
from pathlib import Path

import tomli

from scripts.apigen.config import ApiSourceConfig, ApiSourcesDict
from scripts.apigen.doclinks_postprocessor import process_doc_links
from scripts.apigen.documentation_generator import DocumentationGenerator


def get_mirascope_version(pyproject_path: Path) -> str:
    """Get the Mirascope version from pyproject.toml.

    Args:
        pyproject_path: Path to pyproject.toml

    Returns:
        The Mirascope version string

    """
    with open(pyproject_path, "rb") as f:
        pyproject = tomli.load(f)

    for dep in pyproject.get("project", {}).get("dependencies", []):
        if dep.startswith("mirascope"):
            match = re.search(r"mirascope>=([0-9.]+)", dep)
            if match:
                return match.group(1)

    raise ValueError("Mirascope dependency not found in pyproject.toml")


# Configuration for API documentation sources
# Maps repository/package to documentation target directory
API_SOURCES: ApiSourcesDict = {
    "mirascope": ApiSourceConfig(
        repo="https://github.com/Mirascope/mirascope.git",
        package="mirascope",
        docs_path="api_ref",
        content_subpath="docs/mirascope",
        target_path="content/docs/mirascope/api",
    ),
    # Future configuration for lilypad-sdk would be added here
    # "lilypad-sdk": ApiSourceConfig(
    #     repo="https://github.com/Mirascope/lilypad-sdk.git",
    #     package="lilypad_sdk",
    #     docs_path="docs/api",
    #     content_subpath="docs/lilypad",
    #     target_path="content/docs/lilypad/api",
    # ),
}

# Default source when only one is currently in use
DEFAULT_SOURCE = "mirascope"


def process_source(
    source_name: str,
    source_config: ApiSourceConfig,
    project_root: Path,
    pattern: str | None = None,
) -> bool:
    """Process a single API documentation source.

    Args:
        source_name: Name of the source
        source_config: Configuration for the source
        project_root: Root directory of the project
        pattern: Optional file pattern to regenerate only specific files

    Returns:
        True if successful, False otherwise

    """
    try:
        # Get the package version from pyproject.toml
        pyproject_path = project_root / "pyproject.toml"
        version = get_mirascope_version(pyproject_path)
        print(f"Found {source_name} version: {version}")

        # Initialize the documentation generator
        generator = DocumentationGenerator(source_config, project_root, version)
        generator.setup()

        # Generate documentation
        if pattern:
            # Always regenerate metadata for consistency
            generator.generate_selected(pattern, skip_meta=False)
        else:
            generator.generate_all()

        # Process documentation links
        target_dir = project_root / source_config.target_path
        modified_count = process_doc_links(str(target_dir))
        print(f"Processed documentation links, modified {modified_count} files")

        print(f"Successfully processed {source_name}")
        return True
    except Exception as e:
        print(f"Error processing {source_name}: {e}", file=sys.stderr)
        return False


def normalize_pattern(pattern: str | None) -> str | None:
    """Normalize a file pattern to handle extension issues.

    Strips the extension from the pattern to match files regardless of whether
    they use .md or .mdx extensions.

    Args:
        pattern: The file pattern to normalize

    Returns:
        The normalized pattern

    """
    if not pattern:
        return None

    # If the pattern ends with a file extension (.md or .mdx), strip it
    if pattern.endswith(".md") or pattern.endswith(".mdx"):
        # Get the base name without extension
        return os.path.splitext(pattern)[0]

    return pattern


def parse_source_pattern(pattern: str | None) -> tuple[str, str | None]:
    """Parse a pattern that may include a source prefix.

    If pattern includes a source prefix like "mirascope:core/call.mdx",
    extract the source name and file pattern. Otherwise, use the default source.
    The pattern's file extension will be stripped to work with any extension.

    Args:
        pattern: The pattern string, possibly with a source prefix

    Returns:
        Tuple of (source_name, file_pattern)

    """
    if pattern and ":" in pattern:
        # Pattern includes a source prefix
        source_name, file_pattern = pattern.split(":", 1)
        if source_name not in API_SOURCES:
            raise ValueError(f"Unknown API source '{source_name}' in pattern")
        return source_name, normalize_pattern(file_pattern)

    # No source prefix or no pattern at all
    return DEFAULT_SOURCE, normalize_pattern(pattern)


def main(cmd_args: list[str] | None = None) -> int:
    """Execute the API documentation regeneration process.

    Args:
        cmd_args: Command line arguments

    Returns:
        Exit code

    """
    parser = argparse.ArgumentParser(
        description="Regenerate API documentation from source repositories."
    )
    parser.add_argument(
        "pattern",
        nargs="?",
        help=(
            "Optional pattern to regenerate only matching files. "
            "Will match regardless of whether files use .md or .mdx extensions. "
            "Can include a source prefix like 'mirascope:core/call.mdx'"
        ),
    )

    parsed_args = parser.parse_args(cmd_args)

    # Get the project root directory
    project_root = Path(__file__).parent.parent.parent

    # Determine the source and pattern
    source_name, file_pattern = parse_source_pattern(parsed_args.pattern)

    source_config = API_SOURCES[source_name]
    print(f"\nProcessing {source_name}...")

    # Generate documentation with or without a pattern
    success = process_source(
        source_name,
        source_config,
        project_root,
        file_pattern,
    )

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
