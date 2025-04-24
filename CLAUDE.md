# Project Guidelines for Claude

- Read the README.md before making any significant changes
- If planning to touch the content system, read src/lib/content/DESIGN.md
- Remember to use `bun run typecheck` for typechecking, `bun test` for testing
- Test files should be placed parallel to the modules they test (foo.test.ts, not tests/foo.test.ts)
- Import bun tests in test files
- Don't run the dev server, since it hangs, just ask the user to test any changes