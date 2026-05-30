# CLI tests

| Path                                       | What it checks                                                        |
| ------------------------------------------ | --------------------------------------------------------------------- |
| `integration/pagila-direct-invoke.test.ts` | Pagila in Docker; direct `invokeTool` on generated tools              |
| `integration/sakila-direct-invoke.test.ts` | Sakila in Docker; direct `invokeTool` on generated MySQL tools        |
| `integration/pagila-mcp-stdio.test.ts`     | Pagila in Docker; generated `mcp-serve.js`; MCP stdio list + callTool |
| `generate-validation.test.ts`              | generate blocked on DSL errors                                        |

Run from repo root: `npm test` (includes language + CLI Vitest).

From `packages/cli` only: `npm test`.

Docker must be available for Pagila/Sakila integration tests. Pagila container is started automatically when not already running.

---

#Col3:23
