"""Post-processor for API documentation link resolution.

This module scans MDX files for ApiType components to build a registry of type symbols,
and then resolves doc_identifiers to doc_urls in the generated MDX files containing JSON data.
"""

import logging
import re
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Regex for ApiType components
API_TYPE_REGEX = r'<ApiType\s+(?:[^>]*\s+)?type="([^"]+)"\s+path="([^"]+)"\s+symbolName="([^"]+)"[^>]*>'

# Regex for JSON doc_identifier
DOC_IDENTIFIER_REGEX = r'"doc_identifier":\s*"([^"]+)"'

# Builtin type mapping from Python docs
PYTHON_DOCS_BASE = "https://docs.python.org/3/library/"
PYDANTIC_DOCS_BASE = "https://docs.pydantic.dev/latest/api/"
BUILTIN_TYPE_URLS: dict[str, str] = {
    # Basic types
    "str": f"{PYTHON_DOCS_BASE}stdtypes.html#str",
    "int": f"{PYTHON_DOCS_BASE}functions.html#int",
    "float": f"{PYTHON_DOCS_BASE}functions.html#float",
    "bool": f"{PYTHON_DOCS_BASE}functions.html#bool",
    "bytes": f"{PYTHON_DOCS_BASE}stdtypes.html#bytes",
    "bytearray": f"{PYTHON_DOCS_BASE}stdtypes.html#bytearray",
    "memoryview": f"{PYTHON_DOCS_BASE}stdtypes.html#memoryview",
    "complex": f"{PYTHON_DOCS_BASE}functions.html#complex",
    "object": f"{PYTHON_DOCS_BASE}functions.html#object",
    "None": f"{PYTHON_DOCS_BASE}constants.html#None",
    # Sequence types
    "list": f"{PYTHON_DOCS_BASE}stdtypes.html#list",
    "tuple": f"{PYTHON_DOCS_BASE}stdtypes.html#tuple",
    "range": f"{PYTHON_DOCS_BASE}stdtypes.html#range",
    # Mapping types
    "dict": f"{PYTHON_DOCS_BASE}stdtypes.html#dict",
    # Set types
    "set": f"{PYTHON_DOCS_BASE}stdtypes.html#set",
    "frozenset": f"{PYTHON_DOCS_BASE}stdtypes.html#frozenset",
    # Other builtin types
    "type": f"{PYTHON_DOCS_BASE}functions.html#type",
    # Typing module
    "Any": f"{PYTHON_DOCS_BASE}typing.html#typing.Any",
    "Union": f"{PYTHON_DOCS_BASE}typing.html#typing.Union",
    "Optional": f"{PYTHON_DOCS_BASE}typing.html#typing.Optional",
    "List": f"{PYTHON_DOCS_BASE}typing.html#typing.List",
    "Dict": f"{PYTHON_DOCS_BASE}typing.html#typing.Dict",
    "Set": f"{PYTHON_DOCS_BASE}typing.html#typing.Set",
    "FrozenSet": f"{PYTHON_DOCS_BASE}typing.html#typing.FrozenSet",
    "Tuple": f"{PYTHON_DOCS_BASE}typing.html#typing.Tuple",
    "Callable": f"{PYTHON_DOCS_BASE}typing.html#typing.Callable",
    "Type": f"{PYTHON_DOCS_BASE}typing.html#typing.Type",
    "TypeVar": f"{PYTHON_DOCS_BASE}typing.html#typing.TypeVar",
    "Generic": f"{PYTHON_DOCS_BASE}typing.html#typing.Generic",
    "Literal": f"{PYTHON_DOCS_BASE}typing.html#typing.Literal",
    "ClassVar": f"{PYTHON_DOCS_BASE}typing.html#typing.ClassVar",
    "Final": f"{PYTHON_DOCS_BASE}typing.html#typing.Final",
    "Protocol": f"{PYTHON_DOCS_BASE}typing.html#typing.Protocol",
    "Annotated": f"{PYTHON_DOCS_BASE}typing.html#typing.Annotated",
    "TypedDict": f"{PYTHON_DOCS_BASE}typing.html#typing.TypedDict",
    "NotRequired": f"{PYTHON_DOCS_BASE}typing.html#typing.NotRequired",
    "Required": f"{PYTHON_DOCS_BASE}typing.html#typing.Required",
    # Pydantic types
    "BaseModel": f"{PYDANTIC_DOCS_BASE}base_model/",
    "SkipJsonSchema": f"{PYDANTIC_DOCS_BASE}json_schema/#pydantic.json_schema.SkipJsonSchema",
    "SkipValidation": f"{PYDANTIC_DOCS_BASE}functional_validators/#pydantic.functional_validators.SkipValidation",
}


class SymbolRegistryBuilder:
    """Builds a registry of type symbols by scanning ApiType components in MDX files."""

    def __init__(self, docs_dir: str):
        """Initialize the registry builder.

        Args:
            docs_dir: The directory containing MDX documentation files

        """
        self.docs_dir = Path(docs_dir)
        self.symbol_registry: dict[str, str] = {}  # Maps symbol names to doc URLs

    def build_registry(self) -> dict[str, str]:
        """Scan MDX files for ApiType components and build the symbol registry.

        Returns:
            A dictionary mapping symbol names to documentation URLs

        """
        logger.info(f"Building symbol registry from {self.docs_dir}")
        mdx_files = list(self.docs_dir.glob("**/*.mdx"))
        logger.info(f"Found {len(mdx_files)} MDX files to scan")

        # First, add all builtin types
        self.symbol_registry.update(BUILTIN_TYPE_URLS)

        # Then scan MDX files for ApiType components
        for file_path in mdx_files:
            try:
                with open(file_path, encoding="utf-8") as f:
                    content = f.read()

                # Find all ApiType components
                for match in re.finditer(API_TYPE_REGEX, content):
                    _, doc_path, symbol_name = match.groups()
                    # Create a URL fragment from the symbol name
                    fragment = f"{symbol_name.lower()}"
                    doc_url = f"/docs/mirascope/api/{doc_path}#{fragment}"

                    # Add to the registry
                    self.symbol_registry[symbol_name] = doc_url

            except Exception as e:
                logger.error(f"Error scanning file {file_path}: {e}")

        logger.info(f"Symbol registry contains {len(self.symbol_registry)} entries")
        return self.symbol_registry


class DocIdentifierProcessor:
    """Processes MDX files to resolve doc_identifiers to doc_urls."""

    def __init__(self, symbol_registry: dict[str, str]):
        """Initialize the processor.

        Args:
            symbol_registry: A dictionary mapping symbol names to doc URLs

        """
        self.symbol_registry = symbol_registry

    def get_doc_url_for_identifier(self, identifier: str) -> str | None:
        """Get the documentation URL for a given identifier.

        Applies special case transformations to try to find a match:
        1. Try the exact identifier first
        2. Try the identifier with leading underscore removed
        3. Try the identifier with trailing 'T' removed
        4. Try the identifier with both leading underscore and trailing 'T' removed

        Args:
            identifier: The type identifier to find a URL for

        Returns:
            The documentation URL if found, or None

        """
        # Try the exact identifier first
        if identifier in self.symbol_registry:
            return self.symbol_registry[identifier]

        # Try special case transformations

        # 1. Remove leading underscore if present
        if identifier.startswith("_"):
            no_underscore = identifier[1:]
            if no_underscore in self.symbol_registry:
                return self.symbol_registry[no_underscore]

        # 2. Remove trailing 'T' if present
        if identifier.endswith("T"):
            no_t = identifier[:-1]
            if no_t in self.symbol_registry:
                return self.symbol_registry[no_t]

        # 3. Remove both leading underscore and trailing 'T'
        if identifier.startswith("_") and identifier.endswith("T"):
            transformed = identifier[1:-1]
            if transformed in self.symbol_registry:
                return self.symbol_registry[transformed]

        return None

    def process_file(self, file_path: Path) -> bool:
        """Process a single MDX file to resolve doc_identifiers.

        Args:
            file_path: The path to the MDX file

        Returns:
            True if the file was modified, False otherwise

        """
        try:
            with open(file_path, encoding="utf-8") as f:
                content = f.read()

            # Find all doc_identifier occurrences and replace them
            modified_content = content
            for match in re.finditer(DOC_IDENTIFIER_REGEX, content):
                identifier = match.group(1)

                # Get the URL for this identifier (with special case handling)
                doc_url = self.get_doc_url_for_identifier(identifier)

                # Skip if we couldn't find a URL
                if not doc_url:
                    logger.debug(f"No match found for identifier: {identifier}")
                    continue

                # Replace the doc_identifier with doc_url
                doc_identifier_str = f'"doc_identifier": "{identifier}"'
                doc_url_str = f'"doc_url": "{doc_url}"'

                # Replace the doc_identifier with doc_url
                modified_content = modified_content.replace(
                    doc_identifier_str, doc_url_str
                )

            # Only write if changes were made
            if modified_content != content:
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(modified_content)
                return True

            return False

        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
            return False


def process_doc_links(docs_dir: str) -> int:
    """Process documentation links in MDX files.

    Args:
        docs_dir: The directory containing MDX documentation files

    Returns:
        The number of files modified

    """
    # Build the symbol registry
    registry_builder = SymbolRegistryBuilder(docs_dir)
    symbol_registry = registry_builder.build_registry()

    # Process doc_identifier fields
    processor = DocIdentifierProcessor(symbol_registry)

    # Process all MDX files
    docs_path = Path(docs_dir)
    mdx_files = list(docs_path.glob("**/*.mdx"))
    logger.info(f"Processing {len(mdx_files)} MDX files")

    modified_count = 0
    for file_path in mdx_files:
        if processor.process_file(file_path):
            modified_count += 1

    logger.info(f"Modified {modified_count} files")
    return modified_count
