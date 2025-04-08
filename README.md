# Mirascope Website

URL: [https://mirascope.com](https://mirascope.com)

## Development

### Setup

This project uses [Bun](https://bun.sh/) - a fast all-in-one JavaScript runtime and toolkit.

```bash
# Install dependencies
bun install

# Start development server
bun run start
```

### Commands

#### Main Commands
- `bun run start` - Start development server
- `bun run build` - Build for production
- `bun run serve` - Preview production build

#### Validation and Fixing
- `bun run lint` - Run all checks (TypeScript, MDX, Python snippets, formatting)
- `bun run fix` - Automatically fix formatting and update snippets

#### Specialized Commands
- `bun run lint:ts` - Check TypeScript types
- `bun run lint:mdx` - Validate MDX files and check if snippets are up-to-date
- `bun run lint:py` - Run typechecking and linting on Python snippets
- `bun run lint:format` - Check if files need formatting
- `bun run fix:format` - Format all files with Prettier
- `bun run fix:snippets` - Update extractable code snippets
- `bun run snippets:check` - Check if snippets are up-to-date (alias for `scripts/update-snippets.ts --check`)

### Pre-commit Hooks

This project uses [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged) to automatically:

1. Format staged files with Prettier
2. Validate MDX files
3. Check if code snippets are up-to-date
4. Run TypeScript type checking

These checks run automatically when you attempt to commit changes, helping maintain code quality and consistency.

### Code Snippet Extraction

The documentation contains Python code snippets that are automatically extracted to create runnable example files. These examples are stored in the repository and verified by CI to ensure they stay in sync with the documentation.

#### How it works

1. In `src/docs/_meta.ts`, docs with extractable snippets are marked with `hasExtractableSnippets: true`
2. The extraction system pulls Python code blocks from these MDX files
3. For each provider (OpenAI, Anthropic), it generates runnable example files with substituted variables
4. Examples are stored in `public/extracted-snippets/` with an organized directory structure

#### Working with Snippets

- `bun run fix:snippets` - Update all extractable snippets for all providers
- `bun run snippets:check` - Check if snippets are up-to-date
- You can also use the original script with more options:
  - `bun run scripts/update-snippets.ts --path=<file-path>` - Update snippets for a specific file
  - `bun run scripts/update-snippets.ts --check --path=<file-path>` - Check if snippets for a specific file are up-to-date
  - `bun run scripts/update-snippets.ts --help` - View all available options

#### CI Integration

Our CI workflow automatically verifies that all code is properly formatted, type-checked, and that extracted snippets are up-to-date with the source documentation. If you modify MDX files with code snippets, make sure to run `bun run fix` before committing to update all snippets and formatting.

## License

Everything in this repository is licensed under the [MIT License](https://github.com/Mirascope/website/blob/main/LICENSE) except for "Williams-Handwriting-Regular-v1.tff", which is a closed license font and not available for use without express permission.
