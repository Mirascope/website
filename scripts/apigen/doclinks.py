"""Griffe extension for handling API documentation links.

This module provides a Griffe extension that adds cross-references between API documentation
and usage documentation. It processes docstrings to find "usage-docs" directives and updates
the corresponding documentation files with links.

Adapted from the Pydantic team's original script:
https://github.com/pydantic/pydantic/blob/main/docs/plugins/griffe_doclinks.py
"""

from __future__ import annotations

import logging
import re
import traceback
from pathlib import Path
from urllib.parse import urlparse

from griffe import Extension
from griffe import Object as GriffeObject
from pymdownx.slugs import slugify

# Configure logger
logger = logging.getLogger("griffe_doclinks")
logger.setLevel(logging.DEBUG)


def safe_regex_search(pattern: str, string: str, flags: int = 0) -> re.Match | None:
    """Safely perform a regex search, handling any regex errors.

    Args:
        pattern: The regex pattern to search for
        string: The string to search in
        flags: Optional regex flags

    Returns:
        A match object if found, None otherwise

    """
    try:
        return re.search(pattern, string, flags)
    except re.error as e:
        logger.error(f"Regex error with pattern '{pattern}': {e!s}")
        return None


def find_heading(content: str, slug: str, file_path: Path) -> tuple[str, int]:
    """Find a heading in the content that matches the given slug.

    Args:
        content: The content to search in
        slug: The slug to match
        file_path: The file path for error reporting

    Returns:
        A tuple of the heading text and the end position

    Raises:
        ValueError: If the heading is not found

    """
    results = safe_regex_search(r"^#+ (.+)", content, flags=re.M)
    for m in results or []:
        heading = m.group(1)
        h_slug = slugify()(heading, "-")
        if h_slug == slug:
            return heading, m.end()
    raise ValueError(f"heading with slug {slug!r} not found in {file_path}")


def get_local_api_link(content_subpath: str, obj_path: str) -> str:
    """Generate a local API link for the given object path.

    Args:
        content_subpath: Local subpath for this project
        obj_path: The path to the object

    Returns:
        A local API link

    """
    path_parts = obj_path.split(".")
    return f"/{content_subpath}/api/{'/'.join(path_parts)}"


def insert_or_update_api_section(file_path: Path, api_link: str, obj_path: str) -> None:
    """Insert or update an API section in the given file.

    Args:
        file_path: The file to update
        api_link: The API link to insert
        obj_path: The path to the object

    """
    try:
        content = file_path.read_text()
        api_section = (
            f'<Callout type="api">\n\n[`{obj_path}`]({api_link})\n\n</Callout>\n\n'
        )

        if '<Callout type="api">' in content:
            content = re.sub(
                r'<Callout type="api">\n\n.*?\n\n</Callout>\n\n',
                api_section,
                content,
                flags=re.DOTALL,
            )
        else:
            first_heading_match = safe_regex_search(r"^# .+\n", content, re.MULTILINE)
            if first_heading_match:
                first_heading_end = first_heading_match.end()
                content = f"{content[:first_heading_end]}\n{api_section}{content[first_heading_end:]}"
            else:
                content = f"{api_section}{content}"

        file_path.write_text(content)
    except Exception:
        logger.warning(traceback.format_exc())


def update_links(obj: GriffeObject, content_dir: Path, content_subpath: str) -> None:
    """Update links in the object's docstring.

    Args:
        obj: The Griffe object
        content_dir: The path to the content directory
        content_subpath: The subpath for content, e.g. /docs/mirascope.

    """
    try:
        docstring = obj.docstring
        if not docstring or not docstring.value:
            return

        logger.debug(f"Processing docstring for {obj.path}")

        # Find usage docs link
        usage_docs_match = safe_regex_search(
            r"usage[\s-]*docs:[\s]*(\S+)", docstring.value, flags=re.I
        )
        if not usage_docs_match:
            return

        usage_docs_link: str = usage_docs_match.group(1)
        logger.debug(f"Found usage docs link: {usage_docs_link}")

        # Parse the usage docs link
        parsed_link = urlparse(usage_docs_link)

        local_link = usage_docs_link
        if parsed_link.netloc == "mirascope.com":
            local_link = parsed_link.path.lstrip("/")

        # Split the local link into path and fragment
        local_path, _, fragment = local_link.partition("#")
        local_path = local_path.rstrip("/")
        if local_path.endswith(".md"):
            local_path = local_path[:-3]
        local_path = content_subpath + "/" + local_path

        # Find the corresponding MDX file
        usage_file_path = content_dir / local_path.rstrip("/")
        if not usage_file_path.exists():
            usage_file_path = usage_file_path.with_suffix(".mdx")

        if not usage_file_path.exists():
            logger.warning(f"Usage docs file not found: {usage_file_path}")
            return

        # Update the API section in the usage docs file
        local_api_link = get_local_api_link(content_subpath, obj.path)
        insert_or_update_api_section(usage_file_path, local_api_link, obj.path)

        # Reconstruct the link with the fragment
        full_local_link = f"/{local_path}"
        if fragment:
            full_local_link += f"#{fragment}"

        # Create the usage docs section
        usage_docs_section = f'<Info title="Usage">\n\n[{usage_file_path.stem.replace("_", " ").title()}]({full_local_link})\n\n</Info>\n\n'

        # Replace the original usage docs line with the new section
        docstring.value = re.sub(
            r"usage[\s-]*docs:[\s]*\S+\n?",
            usage_docs_section,
            docstring.value,
            flags=re.I,
        )

        logger.debug(f"Successfully updated links for {obj.path}")
    except Exception as e:
        logger.error(f"Error in update_links for {obj.path}: {e!s}")
        logger.debug(traceback.format_exc())


class UpdateDocstringsExtension(Extension):
    """Griffe extension for updating docstrings with cross-references."""

    def __init__(self, content_dir: Path, content_subpath: str):
        """Initialize the extension.

        Args:
            content_dir: The path to the content directory
            content_subpath: The subpath (e.g. /docs/mirascope) to use for resolving files
                and constructing links.

        """
        self.content_dir = content_dir
        self.content_subpath = content_subpath.strip("/")

    def on_instance(self, **kwargs) -> None:
        """Process a Griffe object instance.

        Args:
            **kwargs: Keyword arguments from Griffe

        """
        try:
            obj = kwargs.get("obj")
            if obj is not None and not obj.is_alias and obj.docstring is not None:
                update_links(obj, self.content_dir, self.content_subpath)
        except Exception as e:
            logger.error(f"Error in UpdateDocstringsExtension: {e!s}")
            logger.debug(traceback.format_exc())
