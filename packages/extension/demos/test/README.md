# Demo integration tests

Docker-backed Vitest tests for generated tools and MCP stdio. Live next to the demo DSL, OpenAPI/SQL fixtures, and Docker compose files they exercise.

| Path                                            | What it checks                                  |
| ----------------------------------------------- | ----------------------------------------------- |
| `integration/pagila-direct-invoke.test.ts`      | Pagila Postgres; direct `invokeTool`            |
| `integration/sakila-direct-invoke.test.ts`      | Sakila MySQL; direct `invokeTool`               |
| `integration/access-demo-direct-invoke.test.ts` | access-demo; public / protected / checked tools |
| `integration/pagila-mcp-stdio.test.ts`          | Pagila; generated `mcp-serve.js` via MCP stdio  |

Run from repo root: `npm test` (includes these after CLI unit tests).

From this folder: `npm test` (after `npm install` here).

Docker must be available. Database containers are started automatically when not already running.

---

#Col3:23
