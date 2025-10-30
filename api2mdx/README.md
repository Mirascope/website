# api2mdx

`api2mdx` is a Python tool that generates MDX documentation for Python APIs by analyzing source code with the Griffe library. It creates structured documentation rendered using custom React components.

Designed to work with custom components like `<ParametersTable>`, `<ReturnTable>`, `<ApiType>`, etc. Currently these live in the website codebase but could be extracted to a shared UI library.

## Quick Start

Generate API documentation from Python source code:

```bash
cd api2mdx
uv run -m api2mdx.main \
  --source-path ./src \
  --package mypackage \
  --output ./docs/api
```

For the Mirascope website, use the sync script which handles both content syncing and API generation:

```bash
bun scripts/sync-docs.ts
```

## Command-line Options

- `--source-path`: Path to the Python source code directory
- `--package`: Python package name to document (e.g., `mirascope.llm`)
- `--output`: Path where generated MDX files should be written
- `--docs-path`: Path within the package where docs are located (default: `docs/api`)
- `--output-directives`: (Optional) Path to output intermediate directive files for debugging

## How It Works

### Architecture Overview

```text
Python Code Analysis → API Discovery → Directive Processing → MDX Generation → React Rendering
     (Griffe)        (api_discovery)   (models.py)      (mdx_renderer)    (ParametersTable)
                                                                           (ReturnTable, etc.)
```

### Two-Stage Generation Process

1. **API Discovery & Directive Generation**:
   - Scans Python modules using Griffe
   - Respects `__all__` exports as the source of truth
   - Generates directive specifications: `<Directive path="mirascope.llm.calls.AsyncCall" />`
   - Organizes by export structure (e.g., `responses/__init__.py` exports `Response` → `responses.mdx`)

2. **MDX Generation**:
   - Processes directives to extract detailed API information
   - Renders final MDX files with React components and JSON data
   - Generates `_meta.ts` TypeScript navigation metadata

### Output Structure

The tool generates:

- **MDX files**: API documentation with React components (e.g., `calls.mdx`, `responses.mdx`)
- **_meta.ts**: TypeScript navigation metadata for the documentation site
- **Directive files** (if `--output-directives` is specified): Intermediate `.md` files for debugging

## Key Components

### Core Processing

- **main.py**: Entry point for the API documentation generation process
- **documentation_generator.py**: Orchestrates the entire documentation generation workflow
- **api_discovery.py**: Discovers API structure from modules and generates directive specifications
- **models.py**: Contains the structured data models (`ProcessedModule`, `ProcessedFunction`, etc.)
- **griffe_integration.py**: Integrates with the Griffe library to extract API data

### Rendering

- **mdx_renderer.py**: Renders the processed models into MDX with component references
- **mdx_components.py**: Utilities for rendering React components (`ApiType`, `ParametersTable`, etc.)
- **meta.py**: Generates `_meta.ts` navigation metadata files

### Type System

- **type_extractor.py**: Extracts type information from Griffe objects
- **type_model.py**: Data models for type information (`TypeInfo`, `ParameterInfo`, `ReturnInfo`)
- **type_urls.py**: Maps types to documentation URLs
- **parser.py**: Parses type strings and docstrings

### Utilities

- **admonition_converter.py**: Converts docstring admonitions to MDX format
- **tokenizer.py**: Tokenizes Python code for parsing

## MDX to React Component Flow

The MDX files include custom component references that pass data from Python to TypeScript:

1. Python processes API information into structured data models
2. MDX is generated with component references and JSON data embedded
3. React components receive this data as props
4. Components render the API information with proper styling and functionality

### Available Components

- `<ApiType>`: Renders type badges (Class, Function, Module, etc.)
- `<ParametersTable>`: Displays function/method parameters
- `<ReturnTable>`: Shows return type information
- `<AttributesTable>`: Lists class attributes
- `<TypeLink>`: Creates links to type documentation

Example flow:

```text
Python extracts parameters → ParameterInfo models →
MDX with <ParametersTable parameters={[...]}/> →
React ParametersTable.tsx component renders the UI
```

## Type Safety Boundary

The interface between Python and TypeScript relies on properly formatted JSON data in the MDX. The parameter format in `mdx_renderer.py` must match the expected props in React components.

For example:

- `ParametersTable` in MDX expects `parameters` prop as a JSON array
- The React component defines this with TypeScript type `Parameter[]`
- The Python code must generate JSON that matches this structure

When extending the system:

1. Update both the TypeScript component props and the Python rendering code
2. Ensure the JSON structure matches between Python output and TypeScript expectations
3. Consider adding validation to catch inconsistencies (e.g., Zod schemas in React components)

## Development

### Snapshot Testing

The project includes test snapshots for validation. To regenerate all snapshots:

```bash
cd api2mdx
uv run regenerate-snapshots
```

This will:

1. Generate MDX documentation files in `snapshots/mdx/`
2. Generate intermediate directive files in `snapshots/directives/` (useful for debugging)
3. Process documentation links and generate metadata

### Snapshot Structure

```text
snapshots/
├── mirascope_v2_llm/        # Source Python code (test fixtures)
├── mdx/                     # Generated MDX documentation
└── directives/              # Intermediate directive files (for debugging)
```

### Running Tests

```bash
cd api2mdx
uv run pytest
```
