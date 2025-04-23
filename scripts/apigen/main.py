#!/usr/bin/env python3
"""Regenerate API documentation for Mirascope.

This script:
1. Clones/updates the Mirascope repository at the version specified in pyproject.toml
2. Extracts the API documentation structure
3. Generates MDX files with API documentation based on autodoc directives using Griffe
"""

import argparse
import re
import sys
from pathlib import Path

import tomli

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
API_SOURCES = {
    "mirascope": {
        "repo": "https://github.com/Mirascope/mirascope.git",
        "package": "mirascope",
        "docs_path": "docs/api",
        "target_path": "content/doc/mirascope/api",
    },
    # Future configuration for lilypad-sdk would be added here
    # "lilypad-sdk": {
    #     "repo": "https://github.com/Mirascope/lilypad-sdk.git",
    #     "package": "lilypad_sdk",
    #     "docs_path": "docs/api",
    #     "target_path": "content/doc/lilypad/api",
    # },
}


def process_source(
    source_name: str,
    source_config: dict,
    project_root: Path,
    only_file: str | None = None,
    with_meta: bool = False,
) -> bool:
    """Process a single API documentation source.

    Args:
        source_name: Name of the source
        source_config: Configuration for the source
        project_root: Root directory of the project
        only_file: Optional file pattern to regenerate only specific files
        with_meta: Whether to regenerate metadata when using only_file

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
        if only_file:
            # Skip metadata generation unless with_meta is True
            generator.generate_selected(only_file, skip_meta=not with_meta)
        else:
            generator.generate_all()

        print(f"Successfully processed {source_name}")
        return True
    except Exception as e:
        print(f"Error processing {source_name}: {e}", file=sys.stderr)
        raise e
        return False


def parse_qualified_path(
    only_file: str, sources: dict[str, dict[str, str]]
) -> tuple[str | None, str]:
    """Parse a qualified path like "mirascope:llm/call.mdx" into source and file parts.

    Args:
        only_file: The qualified path
        sources: Dictionary of available API sources

    Returns:
        Tuple of (source_name, file_pattern) - source_name is None if not qualified

    """
    if ":" in only_file:
        source_name, file_pattern = only_file.split(":", 1)
        if source_name not in sources:
            raise ValueError(f"Unknown API source '{source_name}' in qualified path")
        return source_name, file_pattern
    return None, only_file


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
        "--source",
        type=str,
        choices=[*list(API_SOURCES.keys()), "all"],
        default="all",
        help="API source to generate documentation for (default: all)",
    )
    parser.add_argument(
        "--only",
        type=str,
        help=(
            "Only regenerate files matching this pattern. "
            "Can be a qualified path like 'mirascope:llm/call.mdx'"
        ),
    )
    parser.add_argument(
        "--with-meta",
        action="store_true",
        help="Also regenerate metadata file when using --only",
    )

    parsed_args = parser.parse_args(cmd_args)

    # Get the project root directory
    project_root = Path(__file__).parent.parent.parent

    # If --only has a qualified path, use that to determine source
    qualified_source = None
    file_pattern = None
    if parsed_args.only:
        qualified_source, file_pattern = parse_qualified_path(
            parsed_args.only, API_SOURCES
        )

    # Determine which sources to process
    if qualified_source:
        sources_to_process = [qualified_source]
    elif parsed_args.source == "all":
        sources_to_process = list(API_SOURCES.keys())
    else:
        sources_to_process = [parsed_args.source]

    success = True
    for source_name in sources_to_process:
        source_config = API_SOURCES[source_name]
        print(f"\nProcessing {source_name}...")

        # Use file_pattern from qualified path if available, otherwise use --only
        only_file_to_use = file_pattern if qualified_source else parsed_args.only

        if not process_source(
            source_name,
            source_config,
            project_root,
            only_file_to_use,
            parsed_args.with_meta,
        ):
            success = False

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
