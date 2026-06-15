# db2ai demos — tests

| File                                                  | What it covers                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `integration/pagila-direct-invoke.test.ts`            | Generate via `scripts/generate.mjs`; public / protected tools                  |
| `integration/pagila-mcp-stdio.test.ts`                | stdio host codegen (pagila is HTTP in MCP matrix)                              |
| `integration/pagila-mcp-http.test.ts`                 | `pagila` MCP path: passthrough HTTP + `x-api-token`                            |
| `integration/sakila-direct-invoke.test.ts`            | Sakila MySQL tools                                                             |
| `integration/orders-postgres-direct-invoke.test.ts`   | orders-postgres public / protected / checked (Docker Postgres)                 |
| `integration/orders-postgres-oauth-mcp-http.test.ts`  | `orders` MCP path: HTTP (oauth) + oidc JWKS                                    |
| `integration/animals-sqlserver-direct-invoke.test.ts` | SQL Server animals (needs `ANIMALS_SQLSERVER_*` from `.env` or `.env.example`) |
| `integration/plants-oracle-direct-invoke.test.ts`     | Oracle plants (Docker profile `oracle`; `PLANTS_ORACLE_*` env)                 |

Run from `packages/extension/demos`: `npm test` (loads `.env` / `.env.local`, or `.env.example` when `.env` is missing).
