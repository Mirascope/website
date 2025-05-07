"""Configuration types for API documentation generation."""

from dataclasses import dataclass


@dataclass
class ApiSourceConfig:
    """Configuration for an API documentation source."""

    repo: str
    """Git repository URL."""

    package: str
    """Python package name."""

    docs_path: str
    """Path within the package where docs are located."""

    target_path: str
    """Path where generated documentation should be written."""

    content_subpath: str
    """Subpath within content directory for documentation."""

    branch: str | None = None
    """Git branch to use, defaults to main/master."""


ApiSourcesDict = dict[str, ApiSourceConfig]
"""Type for dictionary mapping source names to their configurations."""
