# db2ai MCP demos

Demo workspace: `.db2ai` → `generated/tools/*`, [`.cursor/mcp.json`](./.cursor/mcp.json).

## Quick start

1. **`npm run init`** — kills stale demo processes, creates `.env` once from `.env.example`, install, Docker DBs (Pagila, Sakila, orders-demo), generate, compile, starts **oauth-idp**, HTTP MCP (**pagila**), **orders-demo** OAuth MCP host.
2. Set **`MCP_AUTH_EXPECTED`** and **`DB2AI_AUTH_TOKEN`** in `.env` (same value for Sakila static validation; Pagila uses `MCP_AUTH_EXPECTED=demo` with header `demo` in `mcp.json`).
3. Open this folder in Cursor as workspace root.
4. **Cursor → Settings → MCP** (or **Features → MCP Servers**): enable only the servers you need from [`.cursor/mcp.json`](./.cursor/mcp.json). Disabled servers do not start a host process.
5. After changing **`.env`**, env vars in **`mcp.json`**, or host launch scripts: **restart the affected MCP server** in Cursor (toggle off/on or **Reload MCP**). Env is re-read on tool calls for stdio, but a host restart is required after you change secrets or DB URLs in `.env`.

Re-run init safely: **`npm run init`** (does not overwrite `.env`). Stop MCP/IDP: **`npm run demo:kill-all`**. Orphan demo DB containers: **`npm run db:kill:all`** — `db:up:all` and **`init`** run this automatically before Compose.

## Demos: DSL → MCP server → transport → auth mode

One row per demo database model. **MCP server** = entry name in [`.cursor/mcp.json`](./.cursor/mcp.json).

| DSL / tools module                                               | MCP server (`mcp.json`) | Transport      | Host auth mode      | Notes                                                                                                                       |
| ---------------------------------------------------------------- | ----------------------- | -------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [`pagila.db2ai`](./pagila.db2ai) → `pagila-tools`                | `pagila-http-stateless` | HTTP stateless | **static**          | Header `x-api-token: demo`; host checks `MCP_AUTH_EXPECTED`. Host via [`mcp-http-demos.mjs`](./scripts/mcp-http-demos.mjs). |
| [`sakila.db2ai`](./sakila.db2ai) → `sakila-tools`                | `sakila-stdio`          | stdio          | **static**          | `DB2AI_AUTH_TOKEN` + `MCP_AUTH_EXPECTED` in `.env`; args in `mcp.json`.                                                     |
| [`orders-demo.db2ai`](./orders-demo.db2ai) → `orders-demo-tools` | `orders-demo-oauth`     | OAuth HTTP     | **hs256** (default) | Cursor OAuth login; `ORDERS_DEMO_JWT_SECRET` in `.env`. Host via [`mcp-oauth-demos.mjs`](./scripts/mcp-oauth-demos.mjs).    |

**Auth modes (host):** `static` · `hs256` · `opaque` (not recommended for db2ai production — no upstream validator) · `oidc` (OAuth HTTP only).

### Where host validation is set

| Transport      | Config location                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| stdio          | [`mcp.json`](./.cursor/mcp.json) → `args`                                                                |
| HTTP stateless | [`scripts/mcp-http-demos.mjs`](./scripts/mcp-http-demos.mjs) + `.env`                                    |
| OAuth HTTP     | [`scripts/mcp-oauth-demos.mjs`](./scripts/mcp-oauth-demos.mjs); default **hs256** (no extra `.env` keys) |

**orders-demo optional overrides** (not needed for Cursor MCP): `ORDERS_DEMO_TOKEN` — direct-invoke / integration tests only; `OAUTH_TOKEN_VALIDATION` (`oidc` \| `opaque`); `OAUTH_ISSUER` with `oidc` (defaults to `ORDERS_DEMO_OAUTH_IDP_URL`).

## Local processes

| Process               | Port | Script                          |
| --------------------- | ---- | ------------------------------- |
| Pagila HTTP MCP       | 3853 | `init` / `demo:mcp-http:pagila` |
| OAuth IDP             | 3862 | `demo:oauth-idp`                |
| orders-demo OAuth MCP | 3871 | `demo:mcp-oauth:orders-demo`    |

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
