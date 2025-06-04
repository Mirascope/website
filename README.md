# Mirascope Website

URL: [https://mirascope.com](https://mirascope.com)

## Development

This is a TypeScript / React / Vite / TanStack Router project that creates the Mirascope website. It auto-deploys to Cloudflare for every pull request, and has thorough CI.

### Setup

This project uses [Bun](https://bun.sh/) - a fast all-in-one JavaScript runtime and toolkit.

```bash
# Install dependencies
bun install

# Start development server
bun run start
```

### Python Modules

This project is mostly Typescript/React/etc (as stated above). However, there is a small amount of Python code:
- In the public/examples directory. This includes example Python code which is incorporated into the documentation, and typechecked for safety.
- In the .extracted-snippets directory. This includes example Python code that is automatically extracted from the mdx content, and is typechecked for safety. This should not be edited by hand.
- In the scripts/apigen module, which contains custom Python code for generating API docs for mirascope/mirascope and other libraries.

### Commands

#### Main Commands

- `bun run start [port]` - Start development server
- `bun run build`        - Build for production, except expensive image generation/optimization (and seo-metadata.json generation)
- `bun run build:full`   - Full build including og image generation. Runs in cloudflare.
- `bun run serve`        - Preview production build
- `bun run typecheck`    - Check typescript
- `bun test`             - Run tests with Bun's built-in Jest-compatible test runner
- `bun run lint`         - All lint checks
- `bun run fix`          - All automated fixes (e.g. running prettier)


#### Specialized Commands

- `bun run lint:mdx` - Validate MDX files
- `bun run lint:social` - Check if generated social cards (OG images) are up to date
- `bun run generate-og-images` - Regenerate og images for social preview cards. Also updates seo-metadata.json for the metadata audit dev route.
- `bun run lint:snippets` - Validate code snippets (using pyright and ruff for type/style checking)
- `bun run lint:python` - Run typechecking and linting on the apigen module only
- `bun run lint:format` - Check formatting with Prettier
- `bun run fix:format` - Format all files with Prettier
- `bun run fix:python` - Fix Python code in the scripts/apigen module

### Pre-commit Hooks

This project uses [husky](https://github.com/typicode/husky) and [lint-staged](https://github.com/okonet/lint-staged) to automatically:

1. Format staged files with Prettier
2. Validate MDX files
3. Check if code snippets are up-to-date
4. Run TypeScript type checking

These checks run automatically when you attempt to commit changes, helping maintain code quality and consistency.

### Testing

This project uses Bun's built-in test runner, which offers Jest-compatible APIs and fast performance. Tests are located in files with `.test.ts` extensions throughout the codebase.

To run tests:
```bash
# Run all tests
bun test

# Run tests for specific files
bun test ./src/lib/redirects.test.ts

# Run tests with watch mode
bun test --watch
```

## Other Info

### Content Management

The website uses a unified content management system for handling docs, blog posts, and policy pages. This system provides:

- MDX content processing with frontmatter
- Consistent content loading across development and production
- Typed metadata for each content type
- Error handling and caching
- Document structure specification for documentation

For a detailed overview of the content system architecture, please see [Content System Design](src/lib/content/DESIGN.md). This document covers:

- The content loading pipeline and data flow
- File structure and key components
- Type definitions and interfaces
- Error handling strategy
- Common tasks such as adding new content

### Code Snippet Extraction

The documentation contains Python code snippets that are automatically extracted to create runnable example files.
These examples are stored in the repository and verified by CI to ensure they stay in sync with the documentation.
We find all files matching `content/**/*.mdx`, and process all Python code blocks in such files into snippets.
We then substitute in `openai` as as the provider (for `$PROVIDER`/`$MODEL` substitution), and typecheck the examples.

Files or directories may be excluded from snippet processing by modifying the `IGNORED_PATHS` variable at the top of `generate-snippets.ts`.

To run snippet validation, use `bun run lint:snippets`.

#### Handling Partial Code Examples

For code blocks that represent partial snippets (not meant to be valid on their own), use the `python-snippet-skip` language tag instead of `python`:

```markdown
>  ```python-snippet-skip
>  @app.receiver("audio")
>  async def receive_audio(response: AudioSegment, context: dict[str, Any]) -> None:
>      play(response)
>  ```
```

This prevents these partial examples from being extracted as standalone snippets and avoids validation errors for code that's missing imports or context.
The syntax highlighting still works correctly in the rendered documentation.

#### CI Integration

Our CI workflow automatically verifies that all code is properly formatted, type-checked, and that extracted snippets are up-to-date with the source documentation.

### Social Images Generation

The og social cards (preview images for each route) are automatically generated at build time, when running `bun run build:full`.
You can use `bun run generate-og-images` to regenerate them by hand, and you can use the metadata audit page at http://localhost:3000/dev/audit-metadata to see all of the generated cards.

### SSG Pre-rendering

During build, we pre-render every route so we can deliver a working site to viewers on first page load.
The logic lives in scripts/lib/prerender.ts.
Note that due to difficult-to-debug rehydration issues, we don't rehydrate the content on page load;
rather, we wait for the app to fully load, and then replace the prerendered contents entirely.

#### Internal Link Validation

The build process automatically validates that all internal links in the site point to valid routes.
This helps catch broken links before they make it to production.
The validation is integrated into the prerender step of the build process.

You can also run the link validation manually with:

```bash
bun run validate-links
```

This will check all internal links in the prerendered HTML and report any that point to non-existent routes.
To skip link validation during prerendering (e.g., for testing), use the `--skip-link-validation` flag:

```bash
bun run prerender --skip-link-validation
```

### Themes

We support three color themes: light, dark, and sunset. The themes are setup using tailwind v4 themes in themes.css,
so we have theme-dependent colors like `--color-background`, `--color-foreground`, `--color-muted` which update depending on the theme.
When writing new UI code, avoid using hardcoded colors like `--grey-300` (which, if it looks good on dark mode,
will probably look bad on light mode, and vice versa). Instead, use the theme colors.

### MDX Content

The website makes extensive use of MDX content for docs, blog posts, and policies. There is a unified content loading system in `src/lib/content` which loads and processes the mdx, and makes it available to routes. All routes use TanStack data loaders so the content can be available at SSG prerender time.

#### Content Organization

All content is organized in the `content/` directory at the project root, separated by content type:

- `content/docs/` - Documentation for Mirascope and Lilypad products
- `content/blog/` - Blog posts
- `content/policy/` - Legal documents like privacy policy and terms of service

Development content for testing UI components is kept in `src/components/dev/` since it's more closely tied to the components.

#### Content Types

There are three content types, in order of increasing complexity: `policy`, `blog`, and `doc`. Policy content is stuff like the privacy policy and we have hardcoded routes for each policy. Blog content includes the blog homepage and the many blog posts, but it's fairly straightforward. The `doc` content splits across products (Mirascope and Lilypad), sections (like "API" and "Guides"), and groups and pages. The logic for handling these is somewhat convoluted with many special cases.

The content management system has a design doc at lib/content/DESIGN.md.

### When Adding a Route

You can add new routes implicitly (by adding a new piece of mdx content that is covered by an existing route) or explicitly (by adding a new route to src/routes). In either case, it will get included in sitemap and the static build automatically.

When adding a new explicitly, there are some considerations, please add an `onError` handler to the route as follows:

`onError: (error: Error) => environment.onError(error),`

This is important, as it is the only way the static build will know if the component failed to render. This is because the Tanstack router automatically catches all errors and does not repropagate them, so otherwise the static build will seem to succeed but will prerender broken content.

Also, make sure a `<PageMeta>` component is included in the new route, so that SEO
meta will be set appropriately.

### Cloudflare Integrations

We have a Cloudflare worker that does some request pre-processing for us, e.g. to get the country code so we can determine analytics policies. The worker is manually deployed, however we have the source checked in at cloudflare/worker.js. Also, we have a Cloudflare redirects file at public/_redirects, which is automatically processed by Cloudflare on build.

### Python API Doc Generation

Python API docs (e.g. for mirascope) are generated by the scripts/apigen module.
It depends on the target repo maintaining an api doc folder with markdown folders containing autodoc directives for documentation generation, and uses that folder's structure as the source of truth for the documentation structure.

Api docs are autogenerated (do not modify by hand), and they can be regenerated via `bun run apigen`.

You can regenerate specific files with:
```bash
# Regenerate a specific file
bun run apigen --only llm/call.mdx

# Regenerate a specific file from a specific source
bun run apigen --only mirascope:llm/call.mdx

# Regenerate a file and update metadata
bun run apigen --only llm/call.mdx --with-meta
```

### On dev server start failures

Sometimes, when running `bun run start`, I see the following failure:

```
Port 3000 is available. Starting server...
failed to load config from /Users/dandelion/git/mweb-multi/mweb-2/vite.config.mjs
error when starting dev server:
Error: The service was stopped
```

In these occasions, `rm -rf node_modules && bun install` fixes it.


## License

Everything in this repository is licensed under the [MIT License](https://github.com/Mirascope/website/blob/main/LICENSE) except for "Williams-Handwriting-Regular-v1.tff", which is a closed license font and not available for use without express permission.
