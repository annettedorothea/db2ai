# db2ai MCP demos

Use the **db2ai** extension (VSIX or Extension Development Host). This folder is the recommended **Cursor/VS Code workspace**: `.db2ai` files, generated MCP tools, and [`.cursor/mcp.json`](./.cursor/mcp.json).

> **Links:** Paths are relative to **this demo workspace** unless noted. The db2ai project (DSL, build): [GitHub README](https://github.com/annettodorothea/db2ai/blob/main/README.md).

## Get demos without cloning the repo

1. Install the **db2ai** VSIX.
2. Command Palette → **db2ai: Create demo workspace (MCP examples)** → choose an empty folder.
3. In that folder: `npm install` → `npm run db:up` → copy [`.env.example`](./.env.example) to `.env` → `npm run generate:pagila` (or save [`./pagila.db2ai`](./pagila.db2ai) / **Generate tool code**).
4. Open the folder as workspace → enable MCP server **`db2ai-pagila`** in `.cursor/mcp.json`.

## What you can do here

- Edit **`.db2ai`** — on save, the extension generates `generated/tools/*` and `generated/cli/mcp-serve.mjs`
- Run the **Pagila** PostgreSQL demo (DVD rental sample data) in Docker
- Chat in Cursor with prompts prefixed by **`db2ai`** (see [Demo prompts](#demo-prompts))

## Getting started

Prerequisites: **Node.js 20+**, **Docker Desktop** (running), **db2ai** extension active.

1. Open **this folder** as the workspace (so `.cursor/mcp.json` applies).
2. `npm install`
3. Start Pagila: `npm run db:up` (first start can take about a minute)
4. Set `PAGILA_DATABASE_URL` in [`.env`](./.env) (default: `postgresql://postgres:postgres@localhost:5432/pagila`; see [`.env.example`](./.env.example))
5. Generate tool code: `npm run generate:pagila`, or save [`./pagila.db2ai`](./pagila.db2ai), or Command Palette → **Generate tool code**
6. **Cursor:** Tools & MCP → enable **`db2ai-pagila`** → reload MCP / **Developer: Reload Window**

### Pagila in Docker

```bash
# Docker Desktop must be running
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
- **MCP errors:** ensure `npm run db:up` succeeded and this folder is the workspace root.

## Test in Cursor

1. Workspace = this folder, MCP **`db2ai-pagila`** on.
2. Prompts start with **`db2ai`** ([`./.cursor/rules/mcp-db2ai-only.mdc`](./.cursor/rules/mcp-db2ai-only.mdc)).

| Check | Prompt |
|-------|--------|
| MPAA filter | `db2ai gib mir 20 R rated filme` |
| Search | `db2ai suche in den Filmen nach grace` |
| Actor ↔ films | `db2ai in welchen Filmen spielt Penelope Guiness mit?` |

After DSL changes: `npm run generate:pagila`, save the file, or **Generate tool code**, then reload MCP.

## MCP configuration

[`./.cursor/mcp.json`](./.cursor/mcp.json) registers `db2ai-pagila`. Connection URL comes from env (`PAGILA_DATABASE_URL`), not from the DSL file.

## Example DSL

[`./pagila.db2ai`](./pagila.db2ai) — table tools (`listFilms`, …) with `limit` / `offset`, optional `columns { … }`, and `SQL { … }` tools with `$1`, `$2`, …

## MCP server

| Server | Auth | Prerequisite |
|--------|------|--------------|
| `db2ai-pagila` | PostgreSQL URL in env | `db:up`, generated tools, `PAGILA_DATABASE_URL` |

## Demo prompts

Prefix with **`db2ai`**.

- `db2ai gib mir 20 R rated filme`
- `db2ai suche in den Filmen nach grace`
- `db2ai in welchen Filmen spielt Penelope Guiness mit?`
- `db2ai zeig mir 10 R-Filme und suche darunter nach army`

List tools (`listFilms`, `listActors`, …) use pagination (`limit` default 100, `offset` 0).
