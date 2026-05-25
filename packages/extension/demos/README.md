# db2ai MCP demos

Use the **db2ai** extension (VSIX or Extension Development Host). This folder is the recommended **Cursor/VS Code workspace**: `.db2ai` files, generated MCP tools, and [`.cursor/mcp.json`](./.cursor/mcp.json).

> **Links:** Paths are relative to **this demo workspace** unless noted. The db2ai project (DSL, build): [GitHub README](https://github.com/annettodorothea/db2ai/blob/main/README.md).

## Get demos without cloning the repo

1. Install the **db2ai** VSIX.
2. Command Palette → **db2ai: Create demo workspace (MCP examples)** → choose an empty folder.
3. In that folder: `npm install` → copy [`.env.example`](./.env.example) to `.env`.
4. PostgreSQL demo: `npm run db:up` → `npm run generate:pagila`; MySQL demo: `npm run db:sakila:up` → `npm run generate:sakila`.
5. Open the folder as workspace → enable MCP server **`db2ai-pagila`** or **`db2ai-sakila`** in `.cursor/mcp.json`.

## What you can do here

- Edit **`.db2ai`** — on save, the extension generates `generated/tools/*` and `generated/cli/mcp-serve.mjs`
- Run the **Pagila** PostgreSQL demo and **Sakila** MySQL demo (DVD rental sample data) in Docker
- Chat in Cursor with prompts prefixed by **`db2ai`** (see [Demo prompts](#demo-prompts))

## Getting started

Prerequisites: **Node.js 20+**, **Docker Desktop** (running), **db2ai** extension active.

1. Open **this folder** as the workspace (so `.cursor/mcp.json` applies).
2. `npm install`
3. Copy [`.env.example`](./.env.example) to `.env`.
4. Start Pagila: `npm run db:up` (first start can take about a minute), or start Sakila: `npm run db:sakila:up`.
5. Generate tool code: `npm run generate:pagila` / `npm run generate:sakila`, or save a `.db2ai` file, or Command Palette → **Generate tool code**.
6. **Cursor:** Tools & MCP → enable **`db2ai-pagila`** or **`db2ai-sakila`** → reload MCP / **Developer: Reload Window**.

### Pagila in Docker

```bash
# Docker Desktop must be running
npm run db:up
```

| Script     | Action                                                                   |
| ---------- | ------------------------------------------------------------------------ |
| `db:up`    | Start container (`docker compose up -d --wait` until healthcheck passes) |
| `db:down`  | Stop container                                                           |
| `db:reset` | Remove container/volumes and start fresh                                 |
| `db:psql`  | Interactive `psql` inside the container                                  |

Image: [synthesizedio/pagila:1.2](https://hub.docker.com/r/synthesizedio/pagila) (PostgreSQL with Pagila sample data). Upstream project: [devrimgunduz/pagila](https://github.com/devrimgunduz/pagila).

### Sakila in Docker

```bash
# MySQL Sakila demo on port 53306 by default
npm run db:sakila:up
npm run generate:sakila
```

| Script            | Action                                             |
| ----------------- | -------------------------------------------------- |
| `db:sakila:up`    | Start Sakila MySQL container until healthy         |
| `db:sakila:reset` | Remove the Sakila container and start fresh        |
| `db:mysql`        | Interactive `mysql` shell inside the container     |
| `generate:sakila` | Generate `generated/tools/sakila-tools.*` from DSL |

Image: [sakiladb/mysql:8](https://hub.docker.com/r/sakiladb/mysql) (MySQL with Sakila sample data).

### Troubleshooting

- **Port 55432 in use:** `PAGILA_HOST_PORT=55433 npm run db:up` and set `PAGILA_DATABASE_URL` to `…@localhost:55433/pagila` in `.env`.
- **Port 53306 in use:** `SAKILA_HOST_PORT=53307 npm run db:sakila:up` and set `SAKILA_DATABASE_URL` to `…@localhost:53307/sakila` in `.env`.
- **Timeout on first start:** healthcheck allows ~60s start period; check `docker compose logs pagila` or `docker compose logs sakila`.
- **MCP errors:** ensure the matching `db:*:up` and `generate:*` scripts succeeded and this folder is the workspace root.

## Test in Cursor

1. Workspace = this folder, MCP **`db2ai-pagila`** or **`db2ai-sakila`** on.
2. Prompts start with **`db2ai`** ([`./.cursor/rules/mcp-db2ai-only.mdc`](./.cursor/rules/mcp-db2ai-only.mdc)).

| Check         | Prompt                                                 |
| ------------- | ------------------------------------------------------ |
| MPAA filter   | `db2ai gib mir 20 R rated filme`                       |
| Search        | `db2ai suche in den Filmen nach grace`                 |
| Actor ↔ films | `db2ai in welchen Filmen spielt Penelope Guiness mit?` |

After DSL changes: run the matching `generate:*` script, save the file, or **Generate tool code**, then reload MCP.

## MCP configuration

[`./.cursor/mcp.json`](./.cursor/mcp.json) registers `db2ai-pagila` and `db2ai-sakila`. Connection URLs come from env (`PAGILA_DATABASE_URL`, `SAKILA_DATABASE_URL`), not from the DSL file.

## Example DSL

[`./pagila.db2ai`](./pagila.db2ai) and [`./sakila.db2ai`](./sakila.db2ai) — table tools (`listFilms`, …) with `limit` / `offset`, optional `columns { … }`, and `SQL { … }` tools with logical `$1`, `$2`, …

## MCP server

| Server         | Auth                  | Prerequisite                                           |
| -------------- | --------------------- | ------------------------------------------------------ |
| `db2ai-pagila` | PostgreSQL URL in env | `db:up`, generated tools, `PAGILA_DATABASE_URL`        |
| `db2ai-sakila` | MySQL URL in env      | `db:sakila:up`, generated tools, `SAKILA_DATABASE_URL` |

## Demo prompts

Prefix with **`db2ai`**.

- `db2ai gib mir 20 R rated filme`
- `db2ai suche in den Filmen nach grace`
- `db2ai in welchen Filmen spielt Penelope Guiness mit?`
- `db2ai zeig mir 10 R-Filme und suche darunter nach army`
- `db2ai suche im Sakila Server Filme mit academy`

List tools (`listFilms`, `listActors`, …) use pagination (`limit` default 100, `offset` 0).

---

_Created with gratitude to Jesus Christ._
