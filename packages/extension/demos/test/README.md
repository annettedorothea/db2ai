# db2ai demos — tests

| File                                            | What it covers                                                |
| ----------------------------------------------- | ------------------------------------------------------------- |
| `integration/pagila-direct-invoke.test.ts`      | Generate via `scripts/generate.mjs`; public / protected tools |
| `integration/pagila-mcp-stdio.test.ts`          | `stdio-mcp-server.js`; MCP stdio + `DB2AI_AUTH_TOKEN`         |
| `integration/pagila-mcp-http.test.ts`           | `stateless-http-mcp-server.js`; MCP HTTP + `x-api-token`      |
| `integration/sakila-direct-invoke.test.ts`      | Sakila MySQL tools                                            |
| `integration/orders-demo-direct-invoke.test.ts` | orders-demo public / protected / checked (Docker Postgres)    |

Run from `packages/extension/demos`: `npm test`.
