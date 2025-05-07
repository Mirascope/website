# Project Guidelines for Claude

- Read the README.md before making any significant changes
- When adding code, do not use tailwind colors like `bg-gray-200` and do not set custom dark mode colors via code like `dark:text-blue-300`. Instead, use the shadcn theme colors defined in themes.css like `--color-primary`, `--color-muted`, etc. They will automatically update based on the theme and the active product.
- If planning to touch the content system, read src/lib/content/DESIGN.md
- Remember to use `bun run typecheck` for typechecking, `bun test` for testing
- Test files should be placed parallel to the modules they test (foo.test.ts, not tests/foo.test.ts)
- Import bun tests in test files
- Don't run the dev server, since it hangs, just ask the user to test any changes