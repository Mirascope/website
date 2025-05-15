# Project Guidelines for Claude

- Read the README.md before making any significant changes
- When adding code, do not use tailwind colors like `bg-gray-200` and do not set custom dark mode colors via code like `dark:text-blue-300`. Instead, use the shadcn theme colors defined in themes.css like `--color-primary`, `--color-muted`, etc. They will automatically update based on the theme and the active product.
- If planning to touch the content system, read src/lib/content/DESIGN.md
- Remember to use `bun run typecheck` for typechecking, `bun test` for testing
- Test files should be placed parallel to the modules they test (foo.test.ts, not tests/foo.test.ts)
- Import bun tests in test files
- Don't run the dev server, since it hangs, just ask the user to test any changes

## Style & Workflow Guidelines

- Always use absolute imports (starting with `@`, as in `@/src/lib/content/...`) rather than relative imports.
- AVOID EVER WRITING MULTIPLE VERSION OF THE SAME CODE. Have a STRONG BIAS towards re-using existing code rather than writing redundant code paths.
- When deleting code, DO NOT LEAVE A COMMENT BEHIND! Just delete the code cleanly.
- When moving code, DO NOT create two copies of the file, either by using `cp` or by writing a new copy. Just use the `mv` command.
- When refactoring code, STRONGLY AVOID creating deprecated code paths or littering the codebase with "many ways to do something". If refactoring a function with dependent internal callers, strongly prefer updating the callers rather than creating a deprecated version of the code. The codebase is small enough that such refactors can usually be done cleanly. Only create a deprecated code path if the human you are working with agrees that a clean replacement is infeasible.