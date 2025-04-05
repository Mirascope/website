# Mirascope Website

URL: [https://mirascope.com](https://mirascope.com)

## Development

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

### Commands

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run serve` - Preview production build
- `npm run test` - Run tests
- `npm run typecheck` - Check TypeScript types
- `npm run format` - Format all files with Prettier
- `npm run format:check` - Check if files need formatting
- `npm run update-snippets` - Update or check extractable code snippets (use --help for options)
- `npm run validate:python` - Runs typechecking and linting on extracted Python snippets

### Pre-commit Hooks

This project uses [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged) to automatically:

1. Format staged files with Prettier
2. Run TypeScript type checking

These checks run automatically when you attempt to commit changes, helping maintain code quality and consistency.

### Code Snippet Extraction

The documentation contains Python code snippets that are automatically extracted to create runnable example files. These examples are stored in the repository and verified by CI to ensure they stay in sync with the documentation.

#### How it works

1. In `src/docs/_meta.ts`, docs with extractable snippets are marked with `hasExtractableSnippets: true`
2. The extraction system pulls Python code blocks from these MDX files
3. For each provider (OpenAI, Anthropic), it generates runnable example files with substituted variables
4. Examples are stored in `public/extracted-snippets/` with an organized directory structure

#### Commands

- `npm run update-snippets` - Update all extractable snippets for all providers
- `npm run update-snippets -- --check` - Check if snippets are up-to-date
- `npm run update-snippets -- --path=<file-path>` - Update snippets only for a specific file
- `npm run update-snippets -- --check --path=<file-path>` - Check if snippets for a specific file are up-to-date

#### CI Integration

A GitHub workflow automatically verifies that all extracted snippets are up-to-date with the source documentation. If you modify a document with code snippets, make sure to run `npm run update-snippets` and commit the updated snippets.

## License

Everything in this repository is licensed under the [MIT License](https://github.com/Mirascope/website/blob/main/LICENSE) except for "Williams-Handwriting-Regular-v1.tff", which is a closed license font and not available for use without express permission.
