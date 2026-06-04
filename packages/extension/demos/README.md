# db2ai MCP demos

Demo workspace: `.db2ai` → `generated/tools/*`, [`.cursor/mcp.json`](./.cursor/mcp.json).

## Quick start

1. **`npm run init`** — kills stale demo processes, creates `.env` once from `.env.example`, install, Docker DBs (Pagila, Sakila, orders-demo), generate, compile, starts **oauth-idp**, HTTP MCP (**pagila**), **orders-demo** OAuth MCP host.
2. Open this folder in Cursor; enable servers in **mcp.json**, reload MCP.
3. **Pagila protected tools:** `pagila-http-stateless` uses `headers.x-api-token: demo` (committed); stdio **sakila-stdio** / Pagila stdio use `DB2AI_AUTH_TOKEN` in `.env`.
4. **orders-demo:** Cursor OAuth on **`orders-demo-oauth`** (`Needs login`); optional `ORDERS_DEMO_TOKEN` in `.env` for direct checks.

Re-run init safely: **`npm run init`** (does not overwrite `.env`). Stop MCP/IDP: **`npm run demo:kill-all`**. Orphan demo DB containers (name clash): **`npm run db:kill:all`** — `db:up:all` and **`init`** run this automatically before Compose.

## MCP servers (one transport per demo)

| Server                  | Transport                                     |
| ----------------------- | --------------------------------------------- |
| `sakila-stdio`          | stdio (MySQL Sakila)                          |
| `pagila-http-stateless` | HTTP + `x-api-token` (protected Pagila tools) |
| `orders-demo-oauth`     | OAuth HTTP (Postgres orders + checked tools)  |

## Local processes

| Process               | Port | Script                                     |
| --------------------- | ---- | ------------------------------------------ |
| Pagila HTTP MCP       | 3853 | started by `init` / `demo:mcp-http:pagila` |
| OAuth IDP             | 3862 | `demo:oauth-idp`                           |
| orders-demo OAuth MCP | 3871 | `demo:mcp-oauth:orders-demo`               |

Docker: **`db:up:all`** (Pagila, Sakila, orders-demo Postgres in `orders-demo/`).

## DSL highlights

- [`pagila.db2ai`](./pagila.db2ai) — public + **protected** (`listActors` needs credential).
- [`sakila.db2ai`](./sakila.db2ai) — stdio-only in `mcp.json`.
- [`orders-demo.db2ai`](./orders-demo.db2ai) — **checked** `listCustomerOrders` ([`src/auth/listCustomerOrders.ts`](./src/auth/listCustomerOrders.ts)).

After DSL or core2ai codegen changes: `generate:all`, `build:generated`, reload MCP. If codegen changed in **core2ai**: build core2ai + db2ai extension embed before `generate:all`.

## Tests

```bash
npm test
```

---

#Col3:23
