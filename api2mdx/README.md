# api2mdx

`api2mdx` is a Python tool that generates `mdx` documentation for Python APIs.
Under the hood, it uses Griffe.

`api2mdx` is designed to work in tandem with custom components like `<ParametersTable>`, `<ApiSignature>`, etc. Currently they live in `@mirascope/website` or `@mirascope/docs-viewer`, but later they will be extracted to `@mirascope/ui`.

## Usage

Generate API documentation from Python source code:

```bash
uv run -m api2mdx.main --source-path ./src --package mypackage --output ./docs/api
```

### Options

- `--source-path`: Path to the source code directory
- `--package`: Python package name to document
- `--output`: Path where generated documentation should be written
- `--docs-path`: Path within the package where docs are located (default: docs/api)
- `--pattern`: Optional pattern to regenerate only matching files
- `--output-directives`: Optional path to output intermediate directive files for debugging

### Example

```bash
uv run -m api2mdx.main \
  --source-path ./snapshots \
  --package mirascope_v2_llm \
  --output ./snapshots/mdx \
  --output-directives ./snapshots/directives
```

## Snapshot Regeneration

The project includes test snapshots for validation. To regenerate all snapshots:

```bash
uv run regenerate-snapshots
```

This will:

1. Generate MDX documentation files in `snapshots/mdx/`
2. Generate intermediate directive files in `snapshots/directives/` (useful for debugging)
3. Process documentation links and generate metadata

### Snapshot Structure

```text
snapshots/
├── mirascope_v2_llm/        # Source Python code
├── mdx/                     # Generated MDX documentation
└── directives/              # Intermediate directive files (for debugging)
```

## How It Works

1. **API Discovery**: Scans Python modules and respects `__all__` exports as the source of truth
2. **Path Generation**: Uses export structure for file organization (e.g., `responses/__init__.py` exports `Response` → `responses/Response.mdx`)
3. **Directive Processing**: Generates Griffe directives and processes them into MDX
4. **Metadata Generation**: Creates TypeScript metadata files for navigation
