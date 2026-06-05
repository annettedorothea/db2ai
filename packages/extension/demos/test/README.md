# db2ai demos — tests

| File                                             | What it covers                                                |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `integration/pagila-direct-invoke.test.ts`       | Generate via `scripts/generate.mjs`; public / protected tools |
| `integration/pagila-mcp-stdio.test.ts`           | stdio host codegen (pagila is HTTP in MCP matrix)             |
| `integration/pagila-mcp-http.test.ts`            | `pagila` MCP path: HTTP + `x-api-token`                       |
| `integration/sakila-direct-invoke.test.ts`       | Sakila MySQL tools                                            |
| `integration/orders-demo-direct-invoke.test.ts`  | orders-demo public / protected / checked (Docker Postgres)    |
| `integration/orders-demo-oauth-mcp-http.test.ts` | `orders` MCP path: OAuth HTTP + oidc JWKS                     |

Run from `packages/extension/demos`: `npm test`.
