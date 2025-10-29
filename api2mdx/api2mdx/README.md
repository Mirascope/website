# API Documentation Generator

The `apigen` module generates MDX documentation for the Mirascope API by analyzing Python code using the Griffe library. It creates structured documentation that's rendered using custom React components.

## Overview

This module:
1. Extracts API information from Python code using Griffe
2. Processes this information into structured models
3. Renders the models as MDX files with custom component references
4. These MDX files are then rendered by React components in the website

## Architecture

```
Python Code Analysis → Structured Models → MDX Generation → React Rendering
  (Griffe)          (ProcessedModule)   (mdx_renderer)    (ParametersTable)
```

## Key Components

- **models.py**: Contains the structured data models (`ProcessedModule`, `ProcessedFunction`, etc.)
- **griffe_integration.py**: Integrates with the Griffe library to extract API data
- **mdx_renderer.py**: Renders the processed models into MDX with component references
- **type_utils.py**: Utilities for handling Python type annotations and parameters
- **main.py**: Entry point for the API documentation generation process

## MDX to React Component Flow

The MDX files include custom component references like `<ParametersTable>` and `<ReturnType>` that pass data from Python to TypeScript:

1. Python processes API information into structured data
2. MDX is generated with component references and JSON data
3. React components receive this data as props
4. Components render the API information with proper styling and functionality

Example flow:
```
Python extracts parameters → parameters_to_dict_list() → 
MDX with <ParametersTable parameters={...}> → 
React ParametersTable.tsx component renders the UI
```

## Type Safety Boundary

The interface between Python and TypeScript relies on properly formatted JSON data in the MDX. The parameter format in `mdx_renderer.py` must match the expected props in React components like `ParametersTable.tsx`.

For example:
- `ParametersTable` in MDX expects `parameters` prop as a JSON array
- The React component defines this with TypeScript type `Parameter[]`
- The Python code must generate JSON that matches this structure

## Extending the System

When adding new components or modifying existing ones:

1. Update both the TypeScript component props and the Python rendering code
2. Ensure the JSON structure matches between Python output and TypeScript expectations
3. Consider adding validation to catch inconsistencies (e.g., Zod schemas in React components)

## Usage

Generate API documentation:
```bash
bun run apigen
```

Regenerate a specific file:
```bash
bun run apigen mirascope:core/anthropic/call.mdx
```