# Demo integration tests

Docker-backed Vitest tests for generated tools and MCP stdio. Live next to the demo DSL, OpenAPI/SQL fixtures, and Docker compose files they exercise.

| Path                                            | What it checks                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| `integration/pagila-direct-invoke.test.ts`      | Generate via `scripts/generate.mjs`; Pagila Postgres; direct `invokeTool` |
| `integration/sakila-direct-invoke.test.ts`      | Generate via `scripts/generate.mjs`; Sakila MySQL; direct `invokeTool`    |
| `integration/access-demo-direct-invoke.test.ts` | Generate via `scripts/generate.mjs`; public / protected / checked tools   |
| `integration/pagila-mcp-stdio.test.ts`          | Generate via `scripts/generate.mjs`; `stdio-mcp-server.js`; MCP stdio     |

Run from repo root: `npm test` (includes these after CLI unit tests).

From this folder (standalone demo workspace): `npm install`, then `npm run check` and `npm test`. Docker must be available for integration tests.

---

#Col3:23
