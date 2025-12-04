# cachedHTTP

`cachedHTTP` is a tool for safely recording VCR.py cassettes to cache LLM API calls in Python example files. It automates the process of running Python examples, capturing HTTP interactions, and sanitizing sensitive data before committing cassettes to the repository in a location that's served by an HTTP server.

## Quick Start

Record VCR.py cassettes for Python example files:

```bash
bun run record-cached-http
```

This will process all Python files matching the default pattern (`content/docs/mirascope/v2/examples/**/*.py`) and generate YAML cassette files alongside them.

To process specific files:

```bash {"language":"bash","terminalRows":"33"}
bun run record-cached-http --dry-run --pattern "content/docs/mirascope/v2/examples/intro/decorator/*.py"
```

## Command-line Options

- `--pattern` or `-p`: Glob pattern for Python files to process (default: `content/docs/mirascope/v2/examples/**/*.py`)
- `--dry-run`: Preview changes without executing Python files or generating cassettes

## How It Works

### Architecture Overview

```text
Python Files → Copy to .work → Transform (add VCR decorator) → Execute via uv → 
Capture Cassettes → Sanitize (remove auth tokens) → Copy Back → Cleanup
```

### Workflow Process

1. **File Discovery**: Finds all Python files matching the specified glob pattern
2. **Virtual Environment Setup**: Uses `uv sync` to create and configure a Python virtual environment in `cachedHTTP` directory
3. **File Transformation**: Copies Python files to `cachedHTTP/.work` while adding:

   - `import vcr` statement (if not present)
   - `@vcr.use_cassette('absolute/path/to/file.py.yaml')` decorator before `main()` function

4. **Execution**: Runs each Python file using `uv run python` from the `cachedHTTP` directory
5. **Cassette Capture**: VCR.py intercepts HTTP requests and creates YAML cassette files
6. **Sanitization**: Removes sensitive authentication tokens from cassettes:

   - `x-api-key`
   - `authorization`
   - `x-auth-token`
   - `api-key`
   - `x-anthropic-api-key`
   - `x-openai-api-key`

7. **File Copying**: Copies sanitized cassettes back to original locations (alongside `.py` files)
8. __Checksum Generation__: Adds a `source_sha256` property to the YAML cassette containing the SHA256 hash of the original Python file content to ensure the example and cached HTTP cassette stay in sync
9. **Cleanup**: Removes the `.work` directory after processing

### Directory Structure

```ini
cachedHTTP/
├── .venv/              # Python virtual environment (created by uv sync)
├── .work/              # Temporary staging directory (created during execution, cleaned up after)
├── pyproject.toml      # Python dependencies (vcrpy, mirascope)
├── .python-version     # Python version specification
└── README.md           # This file
```

The `.work` directory is created during execution and contains:

- Copied Python files with VCR decorators added
- Generated YAML cassette files (before sanitization)

## Key Components

### Script: `scripts/record-vcr-cassettes.ts`

The main TypeScript script that orchestrates the entire workflow:

- **File Discovery**: Uses `glob` to find Python files matching the pattern
- **Content Transformation**: Adds VCR decorator and import statements
- **Python Execution**: Runs files via `uv run` using the virtual environment
- **YAML Sanitization**: Parses and cleans cassettes using `js-yaml`
- **File Operations**: Handles copying, directory creation, and cleanup

### Configuration: `pyproject.toml`

Defines the Python dependencies required for recording:

- `vcrpy==7.0.0`: HTTP request recording library
- `mirascope[anthropic]==2.0.0a2`: LLM framework with Anthropic support

### Virtual Environment

The script uses `uv sync` to:

- Create a virtual environment in `cachedHTTP/.venv`
- Install dependencies from `pyproject.toml`
- Ensure consistent Python environment across runs

## Usage Examples

### Process all example files

```bash
bun run record-cached-http
```

### Process specific directory

```bash {"terminalRows":"32"}
bun run record-cached-http --pattern "content/docs/mirascope/v2/examples/intro/**/*.py"
```

### Preview what would be processed (dry run)

```bash
bun run record-cached-http --dry-run
```

### Process a single file

```bash
bun run record-cached-http --pattern "content/docs/mirascope/v2/examples/intro/decorator/sync.py"
```

## Output

For each processed Python file, the script:

1. Creates a `.yaml` cassette file alongside the original `.py` file
2. Adds a `source_sha256` property to the YAML cassette containing the SHA256 hash of the original Python file content
3. The cassette contains recorded HTTP interactions with sensitive data removed
4. Example: `sync.py` → `sync.py.yaml` (with embedded `source_sha256` property)

The cassettes are used by the website's code execution system (Pyodide) to replay API calls without making real HTTP requests.

The embedded checksum ensures that if the Python example file is modified, the cassette can be detected as out of sync and regenerated. The `validate-cassettes` script checks that all cassettes have a `source_sha256` property that matches the current Python file content.

## Sanitization

The script automatically sanitizes cassettes by replacing sensitive authentication headers with placeholder values:

- `x-api-key: ["replace-via-reverse-proxy"]`
- `authorization: ["replace-via-reverse-proxy"]`

This ensures that:

- No API keys are committed to the repository
- Cassettes can be safely shared and versioned
- The website can use a reverse proxy to inject real API keys at runtime

## Troubleshooting

### Cassette not generated

If a cassette file is not generated:

1. Check that the Python file has a `main()` function (required for decorator injection)
2. Verify the Python script runs successfully (check stdout/stderr output)
3. Ensure the virtual environment is set up correctly (`uv sync` should complete successfully)
4. Check that VCR.py is properly installed in the virtual environment

### Python execution errors

If Python files fail to execute:

1. Verify dependencies are installed: `cd cachedHTTP && uv sync`
2. Check Python version matches `.python-version` (currently 3.10)
3. Review error output in the script's stderr messages

### Path issues

If cassettes are created in unexpected locations:

- The script uses absolute paths in VCR decorators to ensure consistent behavior
- Cassettes should always be created next to the Python file in `.work`
- Check the debug output for actual paths being used

## Development

### Updating Dependencies

To update Python dependencies, edit `pyproject.toml`:

```toml
dependencies = [
    "mirascope[anthropic]==2.0.0a2",  # Update version as needed
    "vcrpy==7.0.0",                    # Update version as needed
]
```

Then run `uv sync` to update the virtual environment.

### Modifying Sanitization Rules

To add or remove sanitized headers, edit `scripts/record-vcr-cassettes.ts`:

```typescript
const sensitiveKeys = [
  "x-api-key",
  "authorization",
  // Add more keys here
];
```

### Testing Changes

Use `--dry-run` to preview changes without executing:

```bash
bun run record-cached-http --dry-run --pattern "path/to/test.py"
```

This will show what files would be processed without actually running Python or generating cassettes.
