#!/usr/bin/env python3
"""Regenerate API documentation for Mirascope.

This script:
1. Clones/updates the Mirascope repository at the version specified in pyproject.toml
2. Extracts the API documentation structure
3. Generates MDX files with API documentation based on autodoc directives

Currently, the generated MDX files are placeholders. In future versions, this script
will process autodoc directives and generate complete API documentation.
"""

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import TypeAlias, TypedDict

import tomli

from scripts.api_docs.meta import (
    generate_meta_file_content,
    generate_meta_from_organized_files,
)
from scripts.api_docs.structure import organize_api_files


# Type definitions for API structure
class DirectoryStructure(TypedDict):
    """Structure representing a directory in the API docs."""

    files: list[Path]
    directories: dict[str, "DirectoryStructure"]  # Recursive reference


ApiStructure: TypeAlias = DirectoryStructure


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


def clone_or_update_repo(repo_path: Path, version: str, force: bool = False) -> Path:
    """Clone or update the Mirascope repository.

    Args:
        repo_path: Path to clone the repo to
        version: The version to checkout
        force: Whether to force clone even if the directory exists

    Returns:
        The path to the cloned repository

    """
    if repo_path.exists() and force:
        shutil.rmtree(repo_path)

    if not repo_path.exists():
        print(f"Cloning Mirascope repository to {repo_path}...")
        subprocess.run(
            [
                "git",
                "clone",
                "https://github.com/Mirascope/mirascope.git",
                str(repo_path),
            ],
            check=True,
        )
    else:
        print(f"Updating Mirascope repository at {repo_path}...")
        subprocess.run(
            ["git", "-C", str(repo_path), "fetch", "--all"],
            check=True,
        )

    # Checkout the tag or branch that matches the version
    subprocess.run(
        ["git", "-C", str(repo_path), "checkout", f"v{version}"],
        check=True,
    )

    return repo_path


def get_api_docs_structure(api_docs_path: Path) -> ApiStructure:
    """Extract the API documentation structure from a docs directory.

    Args:
        api_docs_path: Path to the API docs directory

    Returns:
        A structured representation of the API documentation directory

    """
    if not api_docs_path.exists():
        raise ValueError(f"API docs directory not found at {api_docs_path}")

    structure: ApiStructure = {"files": [], "directories": {}}

    for item in api_docs_path.glob("**/*"):
        if item.is_file() and item.suffix in (".md", ".mdx"):
            rel_path = item.relative_to(api_docs_path)
            structure["files"].append(rel_path)
        elif item.is_dir():
            rel_path = item.relative_to(api_docs_path)
            if len(list(item.glob("*"))) > 0:  # Only include non-empty directories
                parts = list(rel_path.parts)
                current = structure["directories"]
                for part in parts:
                    if part not in current:
                        current[part] = {"files": [], "directories": {}}
                    current = current[part]["directories"]

    return structure


def generate_api_docs(
    structure: ApiStructure,
    source_repo_path: Path,
    target_path: Path,
    docs_path: str,
) -> None:
    """Generate API documentation MDX files based on source repository.

    Args:
        structure: The API documentation structure
        source_repo_path: Path to the source repository
        target_path: Path to the output directory
        docs_path: Path to API documentation within the source repository

    """
    api_docs_path = source_repo_path / docs_path

    # Always create/update index.mdx
    index_path = target_path / "index.mdx"
    with open(index_path, "w") as f:
        f.write("---\n")
        # Add auto-generation notice as a comment in the frontmatter
        f.write("# AUTO-GENERATED API DOCUMENTATION - DO NOT EDIT\n")
        f.write("title: Mirascope API Reference\n")
        f.write("description: API documentation for Mirascope\n")
        f.write("---\n\n")
        f.write("# Mirascope API Reference\n\n")
        # Break long lines for the welcome text
        welcome_text = (
            "Welcome to the Mirascope API reference documentation. "
            "This section provides detailed information about the classes, "
            "methods, and interfaces that make up the Mirascope library."
        )
        f.write(f"{welcome_text}\n\n")
        f.write("Use the sidebar to navigate through the different API components.\n\n")

    # Process all files in the structure
    for file_path in structure["files"]:
        source_file = api_docs_path / file_path
        target_file = target_path / file_path.with_suffix(".mdx")

        # Create parent directory if it doesn't exist
        target_file.parent.mkdir(exist_ok=True, parents=True)

        # Always read and regenerate the file
        with open(source_file) as f:
            content = f.read()

        # Extract title from the first heading or use the filename
        title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        if title_match:
            title = title_match.group(1)
        else:
            title = file_path.stem.replace("_", " ").title()

        # Write the target file with frontmatter and placeholder content
        with open(target_file, "w") as f:
            f.write("---\n")
            # Add auto-generation notice as a comment in the frontmatter
            f.write("# AUTO-GENERATED API DOCUMENTATION - DO NOT EDIT\n")
            f.write(f"title: {title}\n")
            f.write(f"description: API documentation for {title}\n")
            f.write("---\n\n")
            f.write(f"# {title}\n\n")

            # Add the original directives from the source file
            directives = extract_directives(content)
            if directives:
                # PLACEHOLDER: Currently just adding the directives as-is
                # In the future, this will process the directives and generate
                # actual API documentation using Griffe
                f.write("\n".join(directives))
                f.write("\n\n")

                placeholder = (
                    "> This is a placeholder. "
                    "Future versions will render full API documentation."
                )
                f.write(f"{placeholder}\n")
            else:
                f.write("Documentation will be generated from API directives.\n")

    # Generate a single _meta.ts file for the entire API structure
    generate_single_meta_file(api_docs_path, target_path)


def extract_directives(content: str) -> list[str]:
    """Extract API directives from the content.

    Args:
        content: The source file content

    Returns:
        A list of directive lines

    """
    directive_pattern = r"::: ([a-zA-Z0-9_.]+)(?:\s+(.+))?"
    directives = []

    for match in re.finditer(directive_pattern, content, re.MULTILINE):
        directives.append(match.group(0))

    return directives


def generate_single_meta_file(
    api_docs_path: Path,
    target_path: Path,
) -> None:
    """Generate a single _meta.ts file for the entire API structure.

    Args:
        api_docs_path: Path to the source API docs directory
        target_path: Path to the target docs directory

    """
    # Organize files by directory
    organized_files = organize_api_files(api_docs_path)

    # Generate a DocSection from the organized files
    api_section = generate_meta_from_organized_files(organized_files)

    # Create the meta file
    meta_path = target_path / "_meta.ts"

    # Generate the TypeScript content
    content = generate_meta_file_content(api_section, "apiMeta")

    # Write the file
    with open(meta_path, "w") as f:
        f.write(content)

    print(f"Generated API meta file at {meta_path}")


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
) -> bool:
    """Process a single API documentation source.

    Args:
        source_name: Name of the source
        source_config: Configuration for the source
        project_root: Root directory of the project

    Returns:
        True if successful, False otherwise

    """
    try:
        # Get the package version from pyproject.toml
        pyproject_path = project_root / "pyproject.toml"
        version = get_mirascope_version(pyproject_path)
        print(f"Found {source_name} version: {version}")

        # Use a persistent repository directory to avoid repeated clones
        repo_dir = project_root / ".api-generation-repos"
        repo_dir.mkdir(exist_ok=True)
        repo_path = repo_dir / f"{source_name}-repo"

        # Clone or update the repository
        repo_path = clone_or_update_repo(repo_path, version)

        # Extract the API documentation structure
        docs_path = source_config["docs_path"]
        structure = get_api_docs_structure(repo_path / docs_path)
        print(f"Found {len(structure['files'])} API documentation files")

        # Generate API documentation
        target_path = project_root / source_config["target_path"]
        # rm the target path if it exists
        if target_path.exists():
            shutil.rmtree(target_path)
        target_path.mkdir(parents=True, exist_ok=True)

        generate_api_docs(structure, repo_path, target_path, docs_path)
        print(f"Generated API documentation at {target_path}")

        return True
    except Exception as e:
        print(f"Error processing {source_name}: {e}", file=sys.stderr)
        return False


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

    parsed_args = parser.parse_args(cmd_args)

    # Get the project root directory
    project_root = Path(__file__).parent.parent.parent

    # Determine which sources to process
    if parsed_args.source == "all":
        sources_to_process = list(API_SOURCES.keys())
    else:
        sources_to_process = [parsed_args.source]

    success = True
    for source_name in sources_to_process:
        source_config = API_SOURCES[source_name]
        print(f"\nProcessing {source_name}...")
        if not process_source(source_name, source_config, project_root):
            success = False

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
