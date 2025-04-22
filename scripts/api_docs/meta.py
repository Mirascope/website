"""TypeScript meta.ts representation in Python.

This module provides Python classes that mirror the TypeScript interfaces used in the
`content/doc/_meta.ts` file for structuring documentation metadata.
"""

import re
from pathlib import Path
from typing import Any


class DocMetaItem:
    """Python representation of TypeScript DocMetaItem interface.

    Attributes:
        title: The title of the documentation item
        has_extractable_snippets: Flag to indicate the doc has code snippets to extract
        items: Nested items for folder-like structure

    """

    def __init__(
        self,
        title: str,
        has_extractable_snippets: bool | None = None,
        items: dict[str, "DocMetaItem"] | None = None,
    ) -> None:
        """Initialize a DocMetaItem.

        Args:
            title: The title of the item
            has_extractable_snippets: Whether the item has extractable code snippets
            items: Dictionary of nested items, if any

        """
        self.title = title
        self.has_extractable_snippets = has_extractable_snippets
        self.items = items

    def to_dict(self) -> dict[str, Any]:
        """Convert to a dictionary for serialization to TypeScript."""
        result: dict[str, Any] = {
            "title": self.title,
        }

        if self.has_extractable_snippets is not None:
            result["hasExtractableSnippets"] = self.has_extractable_snippets

        if self.items is not None:
            items_dict = {}
            for key, item in self.items.items():
                items_dict[key] = item.to_dict()
            result["items"] = items_dict

        return result


class DocGroup:
    """Python representation of TypeScript DocGroup interface.

    Attributes:
        title: The title of the group
        items: Items within the group

    """

    def __init__(self, title: str, items: dict[str, DocMetaItem]) -> None:
        """Initialize a DocGroup.

        Args:
            title: The title of the group
            items: Dictionary of items in this group

        """
        self.title = title
        self.items = items

    def to_dict(self) -> dict[str, Any]:
        """Convert to a dictionary for serialization to TypeScript."""
        items_dict = {}
        for key, item in self.items.items():
            items_dict[key] = item.to_dict()

        return {
            "title": self.title,
            "items": items_dict,
        }


class DocSection:
    """Python representation of TypeScript DocSection interface.

    Attributes:
        title: The title of the section
        default_slug: Optional default slug for the section
        items: Direct section items
        groups: Grouped section items

    """

    def __init__(
        self,
        title: str,
        default_slug: str | None = None,
        items: dict[str, DocMetaItem] | None = None,
        groups: dict[str, DocGroup] | None = None,
    ) -> None:
        """Initialize a DocSection.

        Args:
            title: The title of the section
            default_slug: Default slug for the section
            items: Dictionary of items directly in this section
            groups: Dictionary of groups in this section

        """
        self.title = title
        self.default_slug = default_slug
        self.items = items or {}
        self.groups = groups

    def to_dict(self) -> dict[str, Any]:
        """Convert to a dictionary for serialization to TypeScript."""
        result: dict[str, Any] = {
            "title": self.title,
            "items": {},
        }

        if self.default_slug is not None:
            result["defaultSlug"] = self.default_slug

        for key, item in self.items.items():
            result["items"][key] = item.to_dict()

        if self.groups is not None:
            groups_dict = {}
            for key, group in self.groups.items():
                groups_dict[key] = group.to_dict()
            result["groups"] = groups_dict

        return result

    def to_typescript(self) -> str:
        """Convert the DocSection to TypeScript code."""
        import json

        # Convert to dict then to JSON with indentation for readability
        doc_dict = self.to_dict()
        json_str = json.dumps(doc_dict, indent=2)

        # Replace double quotes with single quotes for TypeScript style
        json_str = json_str.replace('"', "'")

        # Fix boolean values (true/false instead of True/False)
        json_str = json_str.replace("'true'", "true").replace("'false'", "false")

        # Convert JSON keys without quotes to TypeScript style
        json_str = re.sub(r"'(\w+)':", r"\1:", json_str)

        return json_str


def generate_meta_file_content(section: DocSection, export_name: str) -> str:
    """Generate a complete TypeScript meta file content.

    Args:
        section: The DocSection object to convert to TypeScript
        export_name: The name to use for the exported variable

    Returns:
        A string containing the complete TypeScript file content

    """
    content = []

    # Add header
    content.append("/**")
    content.append(" * AUTO-GENERATED API DOCUMENTATION - DO NOT EDIT")
    content.append(" */")
    content.append("")

    # Add imports
    content.append('import type { DocSection } from "@/content/doc/_meta";')
    content.append("")

    # Add the export declaration
    content.append(
        f"export const {export_name}: DocSection = {section.to_typescript()};"
    )
    content.append("")

    # Add default export
    content.append(f"export default {export_name};")

    return "\n".join(content)


def generate_meta_from_organized_files(
    organized_files: dict[str, list[Path]],
) -> DocSection:
    """Generate a DocSection from organized files.

    Args:
        organized_files: A dictionary of files organized by directory

    Returns:
        A DocSection object representing the API structure

    """
    # Create a DocSection for the API
    section_title = "API Reference"

    # Process files in the root directory
    root_files = organized_files.get("", [])
    items = create_items(root_files)
    # Process all subdirectories
    subdirectories = [dir_name for dir_name in organized_files.keys() if dir_name != ""]
    group_names = sorted({dir_name.split("/")[0] for dir_name in subdirectories})
    groups = {name: create_group(name, organized_files) for name in group_names}

    # Create the section with all content
    return DocSection(
        title=section_title,
        items=items,
        groups=groups,
    )


def create_group(group_name: str, organized_files: dict[str, list[Path]]) -> DocGroup:
    """Create a DocGroup from organized files.

    Args:
        group_name: The name of the group
        organized_files: A dictionary of files organized by directory

    Returns:
        A DocGroup object representing the API structure

    """
    group_files = organized_files.get(group_name, [])
    items = create_items(group_files)
    for dir_path, files in sorted(organized_files.items()):
        if dir_path.startswith(group_name + "/"):
            group_path = dir_path.removeprefix(group_name + "/")
            folder = DocMetaItem(title=titleify(group_path))
            folder.items = create_items(files)
            if items.get(folder.title) is not None:
                raise ValueError(
                    f"Duplicate folder name '{folder.title}' in group '{group_name}'"
                )
            items[group_path] = folder

    return DocGroup(title=titleify(group_name), items=items)


def titleify(stem: str) -> str:
    """Convert a string to a title format.

    Args:
        stem: The string to convert

    Returns:
        A title-formatted string

    """
    return stem.replace("_", " ").title()


def create_items(items: list[Path]) -> dict[str, DocMetaItem]:
    """Create a dictionary of DocMetaItem from a list of file paths.

    Args:
        items: A list of file paths

    Returns:
        A dictionary of DocMetaItem objects

    """
    items_dict = {}
    stems = sorted({item.stem for item in items})
    if "index" in stems:
        items_dict["index"] = DocMetaItem(title="Overview")
        stems.remove("index")
    for stem in stems:
        items_dict[stem] = DocMetaItem(title=titleify(stem))
    return items_dict
