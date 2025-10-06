# Customer Block Project Guidelines

## Code Style

### Typescript / Bun

- Always format and lint at the end of any changes and fix any problems
- Use `bun` for all commands
- Use `bunx` to install and run packages
- Use `bun run` to run scripts
- Use `bun test` to run tests
- Use `bun run format` to format the code
- Use `bun run lint` to lint the code
- Use `bun run lint:fix` to lint the code and fix problems
- Prefer `for..of` instead of `forEach`
- Use `import type { ... }` instead of `import { ... }` if the imports are only types
- Do not use template literals if interpolation and special-character handling are not needed.
- Be strict when it comes to typing (no `any`, no `unknown`)

### SQL

- Keywords in UPPERCASE (SELECT, FROM, WHERE)
- Column/table identifiers in snake_case, quoted when necessary
- Indent CTEs and subqueries consistently (4 spaces)
- Use aliases for table names
- Break long lines at logical points (after commas, operators)
- Use CTEs for complex queries instead of nested subqueries
- Use QUALIFY for row filtering where appropriate
