# examples — MCP demos for db2ai

You use the **db2ai** extension (installed from a **VSIX** or via **Extension Development Host** from the monorepo). This folder is the recommended **Cursor/VS Code workspace**: `.db2ai` files, generated MCP tools, and [`.cursor/mcp.json`](./.cursor/mcp.json).

> **Links:** Paths are relative to **`examples/`** unless noted. For the monorepo README, use [`../README.md`](../README.md) (parent = **db2ai** root, not api2ai).

## What you can do here

- Edit **`.db2ai`** — on save, the extension generates `generated/tools/*` and `generated/cli/mcp-serve.mjs`
- Run the **Pagila** PostgreSQL demo (DVD rental sample data) in Docker
- Chat in Cursor with prompts prefixed by **`db2ai`** (see [Demo prompts](#demo-prompts))

Monorepo build and DSL grammar: [`../README.md`](../README.md) in the **db2ai** repository root.

## Getting started (examples)

Prerequisites: **Node.js 20+**, **Docker Desktop** (running), **db2ai** extension active.

1. Open this folder **`examples`** as the workspace.
2. `npm install` in `examples/`
3. Start Pagila: `npm run db:up` (first start can take about a minute)
4. Set `PAGILA_DATABASE_URL` in [`.env`](./.env) (default: `postgresql://postgres:postgres@localhost:5432/pagila`; see [`.env.example`](./.env.example))
5. From **db2ai repo root**: `npm run generate:pagila` (or save [`./pagila.db2ai`](./pagila.db2ai) in the IDE)
6. **Cursor:** Tools & MCP → enable **`db2ai-pagila`** → reload MCP / **Developer: Reload Window**

### Pagila in Docker

```bash
# Docker Desktop must be running
cd examples
npm run db:up
```

| Script | Action |
|--------|--------|
| `db:up` | Start container (`docker compose up -d --wait` until healthcheck passes) |
| `db:down` | Stop container |
| `db:reset` | Remove container/volumes and start fresh |
| `db:psql` | Interactive `psql` inside the container |

Image: [synthesizedio/pagila:1.2](https://hub.docker.com/r/synthesizedio/pagila) (PostgreSQL with Pagila sample data). Upstream project: [devrimgunduz/pagila](https://github.com/devrimgunduz/pagila).

### Troubleshooting

- **Port 5432 in use:** `PAGILA_HOST_PORT=5433 npm run db:up` and set `PAGILA_DATABASE_URL` to `…@localhost:5433/pagila` in `.env`.
- **Timeout on first start:** healthcheck allows ~60s start period; check `docker compose logs pagila`.
- **MCP errors:** ensure `npm run db:up` succeeded and workspace is **`examples/`**.

## Test in Cursor

1. Workspace = **`examples`**, MCP **`db2ai-pagila`** on.
2. Prompts start with **`db2ai`** ([`./.cursor/rules/mcp-db2ai-only.mdc`](./.cursor/rules/mcp-db2ai-only.mdc)).

| Check | Prompt |
|-------|--------|
| MPAA filter | `db2ai gib mir 20 R rated filme` |
| Search | `db2ai suche in den Filmen nach grace` |
| Actor ↔ films | `db2ai in welchen Filmen spielt Penelope Guiness mit?` |

After DSL changes: save or `npm run generate:pagila` from repo root, then reload MCP.

## MCP configuration

[`./.cursor/mcp.json`](./.cursor/mcp.json) registers `db2ai-pagila`. Connection URL comes from env (`PAGILA_DATABASE_URL`), not from the DSL file.

## Example DSL

[`./pagila.db2ai`](./pagila.db2ai) — table tools (`listFilms`, …) with `limit` / `offset`, optional `columns { … }`, and `SQL { … }` tools with `$1`, `$2`, …

## MCP server

| Server | Auth | Prerequisite |
|--------|------|--------------|
| `db2ai-pagila` | PostgreSQL URL in env | `db:up`, `generate:pagila`, `PAGILA_DATABASE_URL` |

## Demo prompts

Prefix with **`db2ai`**.

- `db2ai gib mir 20 R rated filme`
- `db2ai suche in den Filmen nach grace`
- `db2ai in welchen Filmen spielt Penelope Guiness mit?`
- `db2ai zeig mir 10 R-Filme und suche darunter nach army`

List tools (`listFilms`, `listActors`, …) use pagination (`limit` default 100, `offset` 0).
