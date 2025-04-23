"""Documentation generation tools for API reference documentation.

This module provides a DocumentationGenerator class that handles generating API
documentation from source repositories by extracting docstrings and processing
API directives using Griffe.
"""

import fnmatch
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

from scripts.apigen.griffe_integration import get_loader, process_directive
from scripts.apigen.meta import (
    generate_meta_file_content,
    generate_meta_from_organized_files,
)
from scripts.apigen.structure import organize_api_files


class DocumentationGenerator:
    """Handles the generation of API documentation from source repositories.

    This class encapsulates the entire documentation generation process, including:
    - Cloning or updating the source repository
    - Loading the module with Griffe
    - Processing API documentation files
    - Generating formatted MDX output

    Attributes:
        config: Configuration for the documentation source
        project_root: Root directory of the project
        version: Version of the package to document
        repo_path: Path to the cloned repository
        module: Loaded Griffe module
        organized_files: Dictionary of files organized by directory

    """

    def __init__(
        self, config: dict[str, str], project_root: Path, version: str | None = None
    ) -> None:
        """Initialize the DocumentationGenerator.

        Args:
            config: Configuration with repo, package, docs_path, and target_path
            project_root: Root directory of the project
            version: Version of the package to document

        """
        self.config = config
        self.project_root = project_root
        self.version = version
        self.repo_path: Path | None = None
        self.module: Any | None = None
        self.organized_files: dict[str, list[Path]] | None = None

    def setup(self) -> "DocumentationGenerator":
        """Set up the generator by cloning repo, loading module, organizing files.

        Returns:
            Self for method chaining

        """
        # Clone or update the repository
        self.repo_path = self._clone_or_update_repo()

        # Load the module
        self.module = self._load_module()

        # Organize files
        api_docs_path = self.repo_path / self.config["docs_path"]
        self.organized_files = organize_api_files(api_docs_path)
        file_count = sum(len(files) for files in self.organized_files.values())
        print(f"Found {file_count} API documentation files")

        return self

    def generate_all(self) -> None:
        """Generate all documentation files."""
        if not self.organized_files:
            raise RuntimeError("Setup must be called before generating documentation")

        # Clear target directory if it exists
        target_path = self.project_root / self.config["target_path"]
        if target_path.exists():
            shutil.rmtree(target_path)
        target_path.mkdir(parents=True, exist_ok=True)

        # Create index file
        self._create_index_file()

        # Generate all files
        for _, files in self.organized_files.items():
            for file_path in files:
                self.generate_file(file_path)

        # Generate metadata
        self._generate_meta_file()

    def generate_file(self, file_path: Path) -> None:
        """Generate documentation for a specific file.

        Args:
            file_path: Path to the source file relative to the docs_path

        """
        if not self.repo_path or not self.module:
            raise RuntimeError("Setup must be called before generating documentation")

        src_path = self.repo_path / self.config["docs_path"] / file_path
        target_path = (
            self.project_root
            / self.config["target_path"]
            / file_path.with_suffix(".mdx")
        )

        # Ensure target directory exists
        target_path.parent.mkdir(exist_ok=True, parents=True)

        # Process file
        self._process_file(src_path, target_path)

    def generate_selected(self, file_pattern: str, skip_meta: bool = True) -> None:
        """Generate documentation only for files matching the pattern.

        Args:
            file_pattern: Pattern to match against file paths
            skip_meta: Whether to skip metadata generation (default: True)

        """
        if not self.organized_files:
            raise RuntimeError("Setup must be called before generating documentation")

        found = False
        target_path = self.project_root / self.config["target_path"]
        target_path.mkdir(parents=True, exist_ok=True)

        # Create index file if it doesn't exist
        index_path = target_path / "index.mdx"
        if not index_path.exists():
            self._create_index_file()

        for _, files in self.organized_files.items():
            for file_path in files:
                # Check if file matches pattern - with/without extension
                file_str = str(file_path)
                base_name = str(file_path.with_suffix(""))

                if (
                    fnmatch.fnmatch(file_str, file_pattern)
                    or fnmatch.fnmatch(file_str, file_pattern + ".md")
                    or fnmatch.fnmatch(file_str, file_pattern + ".mdx")
                    or fnmatch.fnmatch(base_name, file_pattern)
                ):
                    print(f"Generating: {file_path}")
                    self.generate_file(file_path)
                    found = True

        if not found:
            print(f"No files matched pattern: {file_pattern}")
        elif not skip_meta:
            # Regenerate metadata only if skip_meta is False
            print("Regenerating metadata file...")
            self._generate_meta_file()

    def _clone_or_update_repo(self) -> Path:
        """Clone or update the source repository.

        Returns:
            Path to the cloned repository

        """
        # Use a persistent repository directory to avoid repeated clones
        repo_dir = self.project_root / ".api-generation-repos"
        repo_dir.mkdir(exist_ok=True)

        # Get repository name from URL
        repo_name = self.config["repo"].split("/")[-1].replace(".git", "")
        repo_path = repo_dir / f"{repo_name}-repo"

        # Clone or update the repository
        if repo_path.exists():
            print(f"Updating repository at {repo_path}...")
            subprocess.run(
                ["git", "-C", str(repo_path), "fetch", "--all"],
                check=True,
            )
        else:
            print(f"Cloning repository to {repo_path}...")
            subprocess.run(
                ["git", "clone", self.config["repo"], str(repo_path)],
                check=True,
            )

        # Checkout the tag or branch that matches the version
        if self.version:
            try:
                subprocess.run(
                    ["git", "-C", str(repo_path), "checkout", f"v{self.version}"],
                    check=True,
                    capture_output=True,
                )
                print(f"Checked out v{self.version}")
            except subprocess.CalledProcessError:
                print(f"Warning: Could not checkout v{self.version}, using main branch")

        return repo_path

    def _load_module(self) -> Any:
        """Load the module using Griffe.

        Returns:
            Loaded Griffe module

        """
        if not self.repo_path:
            raise RuntimeError("Repository must be cloned before loading module")

        try:
            # Add repo path to sys.path temporarily
            sys.path.insert(0, str(self.repo_path))

            # Load the module
            loader = get_loader(self.repo_path)
            module = loader.load(self.config["package"])
            loader.resolve_aliases(external=True)

            print(f"Loaded module {self.config['package']}")
            return module
        finally:
            # Clean up sys.path
            if str(self.repo_path) in sys.path:
                sys.path.remove(str(self.repo_path))

    def _process_file(self, src_path: Path, target_path: Path) -> None:
        """Process a source file and generate the corresponding MDX file.

        Args:
            src_path: Path to the source markdown file
            target_path: Path to the target MDX file

        """
        if not self.module:
            raise RuntimeError("Module must be loaded before processing files")

        # Read the source file
        with open(src_path) as f:
            content = f.read()

        # Extract title from the first heading or use the filename
        title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        if title_match:
            title = title_match.group(1)
        else:
            title = src_path.stem.replace("_", " ").title()

        # Write the target file with frontmatter and processed content
        with open(target_path, "w") as f:
            f.write("---\n")
            # Add auto-generation notice as a comment in the frontmatter
            f.write("# AUTO-GENERATED API DOCUMENTATION - DO NOT EDIT\n")
            f.write(f"title: {title}\n")
            f.write(f"description: API documentation for {title}\n")
            f.write("---\n\n")
            f.write(f"# {title}\n\n")

            # Extract and process directives
            directives = self._extract_directives(content)
            for directive in directives:
                doc_content = process_directive(directive, self.module)
                f.write(doc_content)
                f.write("\n\n")

    def _create_index_file(self) -> None:
        """Create the index.mdx file in the target directory."""
        if not self.repo_path:
            raise RuntimeError("Repository must be cloned before creating index file")

        index_path = self.project_root / self.config["target_path"] / "index.mdx"
        product_name = self.config["target_path"].split("/")[-2].title()

        with open(index_path, "w") as f:
            f.write("---\n")
            # Add auto-generation notice as a comment in the frontmatter
            f.write("# AUTO-GENERATED API DOCUMENTATION - DO NOT EDIT\n")
            f.write(f"title: {product_name} API Reference\n")
            f.write(f"description: API documentation for {product_name}\n")
            f.write("---\n\n")
            f.write(f"# {product_name} API Reference\n\n")

            # Break long lines for the welcome text
            welcome_text = (
                f"Welcome to the {product_name} API reference documentation. "
                "This section provides detailed information about the classes, "
                f"methods, and interfaces that make up the {product_name} library."
            )
            f.write(f"{welcome_text}\n\n")
            f.write(
                "Use the sidebar to navigate through the different API components.\n"
            )

    def _generate_meta_file(self) -> None:
        """Generate metadata file and format it with prettier."""
        if not self.organized_files:
            raise RuntimeError("Files must be organized before generating metadata")

        # Generate the metadata
        api_section = generate_meta_from_organized_files(self.organized_files)
        content = generate_meta_file_content(api_section, "apiMeta")

        # Write to file
        meta_path = self.project_root / self.config["target_path"] / "_meta.ts"
        with open(meta_path, "w") as f:
            f.write(content)

        # Run prettier to format the file
        try:
            subprocess.run(
                ["bun", "prettier", "--write", str(meta_path)],
                check=True,
                capture_output=True,
            )
            print(f"Generated and formatted API meta file at {meta_path}")
        except subprocess.CalledProcessError as e:
            print(f"Warning: Prettier formatting failed: {e}")
            print(f"Generated unformatted API meta file at {meta_path}")

    @staticmethod
    def _extract_directives(content: str) -> list[str]:
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
