# db2ai MCP demos

Use the **db2ai** extension (VSIX or Extension Development Host). This folder is the recommended **Cursor/VS Code workspace**: `.db2ai` files, generated MCP tools, and [`.cursor/mcp.json`](./.cursor/mcp.json).

> **Links:** Paths are relative to **this demo workspace** unless noted. The db2ai project (DSL, build): [GitHub README](https://github.com/annettodorothea/db2ai/blob/main/README.md).

## Get demos without cloning the repo

1. Install the **db2ai** VSIX.
2. Create a demo workspace:
    - Open the Command Palette.
    - Run **db2ai: Create demo workspace (MCP examples)**.
    - Choose an empty folder.
3. Prepare the folder:
    - Run `npm install`.
    - Copy [`.env.example`](./.env.example) to `.env`.
4. Start databases and generate tools:
    - Both demos: `npm run db:up:all`, then `npm run generate:all`.
    - PostgreSQL only: `npm run db:pagila:up`, then `npm run generate:pagila`.
    - MySQL only: `npm run db:sakila:up`, then `npm run generate:sakila`.
5. Enable MCP:
    - Open the demo folder as the workspace.
    - Open Cursor Settings, then **Tools & MCP**.
    - Enable **`db2ai-pagila`** or **`db2ai-sakila`**.

## What you can do here

- Edit **`.db2ai`** — on save, the extension generates `generated/tools/*` and `generated/cli/mcp-serve.mjs`
- Run the **Pagila** PostgreSQL demo and **Sakila** MySQL demo (DVD rental sample data) in Docker
- Chat in Cursor with prompts prefixed by **`db2ai`** (see [Demo prompts](#demo-prompts))

## Getting started

Prerequisites: **Node.js 20+**, **Docker Desktop** (running), **db2ai** extension active.

1. Open **this folder** as the workspace so `.cursor/mcp.json` applies.
2. Install dependencies:
    ```bash
    npm install
    ```
3. Copy [`.env.example`](./.env.example) to `.env`.
4. Start databases:
    - Both demos: `npm run db:up:all` (first start can take about a minute).
    - PostgreSQL only: `npm run db:pagila:up`.
    - MySQL only: `npm run db:sakila:up`.
5. Generate tool code:
    - Both demos: `npm run generate:all`.
    - PostgreSQL only: `npm run generate:pagila`.
    - MySQL only: `npm run generate:sakila`.
    - Alternative: save a `.db2ai` file or run **Generate tool code** from the Command Palette.
6. Enable MCP in Cursor:
    - Open **Tools & MCP**.
    - Enable **`db2ai-pagila`** or **`db2ai-sakila`**.
    - Reload MCP after changing `.env`; MCP servers read database URLs when they start, not on every tool call.

### Common scripts

| Script         | Action                                  |
| -------------- | --------------------------------------- |
| `db:up:all`    | Start both Pagila and Sakila containers |
| `db:down`      | Stop all demo containers                |
| `generate:all` | Generate Pagila and Sakila tools        |

### Pagila in Docker

```bash
# Docker Desktop must be running
npm run db:pagila:up
```

| Script              | Action                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| `db:pagila:up`      | Start container (`docker compose up -d --wait` until healthcheck passes) |
| `db:pagila:reset`   | Remove container/volumes and start fresh                                 |
| `db:pagila:psql`    | Interactive `psql` inside the container                                  |
| `generate:pagila`   | Generate `generated/tools/pagila-tools.*` from DSL                       |
| `db:up`, `db:reset` | Backward-compatible Pagila aliases                                       |

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
| `db:sakila:mysql` | Interactive `mysql` shell inside the container     |
| `generate:sakila` | Generate `generated/tools/sakila-tools.*` from DSL |

Image: [sakiladb/mysql:8](https://hub.docker.com/r/sakiladb/mysql) (MySQL with Sakila sample data).

### Troubleshooting

- **Port 55432 in use:** `PAGILA_HOST_PORT=55433 npm run db:pagila:up` and set `PAGILA_DATABASE_URL` to `…@localhost:55433/pagila` in `.env`.
- **Port 53306 in use:** `SAKILA_HOST_PORT=53307 npm run db:sakila:up` and set `SAKILA_DATABASE_URL` to `…@localhost:53307/sakila` in `.env`.
- **Timeout on first start:** healthcheck allows ~60s start period; check `docker compose logs pagila` or `docker compose logs sakila`.
- **Changed `.env`:** reload the matching MCP server so it picks up the new `PAGILA_DATABASE_URL` or `SAKILA_DATABASE_URL`.
- **MCP errors:** ensure the matching `db:*:up` / `generate:*` scripts succeeded and this folder is the workspace root.

## Pagila and Sakila

Both demos use the same DVD rental sample domain, so the film and actor prompts are intentionally comparable:

| Server         | Database   | Use it for                                      |
| -------------- | ---------- | ----------------------------------------------- |
| `db2ai-pagila` | PostgreSQL | PostgreSQL-flavored generation and SQL examples |
| `db2ai-sakila` | MySQL      | MySQL-flavored generation and SQL examples      |

When both MCP servers are enabled, name **Pagila** or **Sakila** in the prompt if you want one specific server. Ask for both when you want to compare the generated tools across PostgreSQL and MySQL.

## Test in Cursor

1. Workspace = this folder, MCP **`db2ai-pagila`** or **`db2ai-sakila`** on.
2. Prompts start with **`db2ai`** ([`./.cursor/rules/mcp-db2ai-only.mdc`](./.cursor/rules/mcp-db2ai-only.mdc)).

| Check              | Prompt                                                                           |
| ------------------ | -------------------------------------------------------------------------------- |
| Pagila rating      | `db2ai nutze Pagila: gib mir 20 R rated Filme`                                   |
| Sakila rating      | `db2ai nutze Sakila: gib mir 20 R rated Filme`                                   |
| Search in one DB   | `db2ai nutze Pagila: suche in den Filmen nach grace`                             |
| Actor films        | `db2ai nutze Sakila: in welchen Filmen spielt Penelope Guiness mit?`             |
| Compare both demos | `db2ai vergleiche Pagila und Sakila: suche Filme mit academy auf beiden Servern` |

After DSL changes: run the matching `generate:*` script, save the file, or **Generate tool code**, then reload MCP.

## MCP configuration

[`./.cursor/mcp.json`](./.cursor/mcp.json) registers `db2ai-pagila` and `db2ai-sakila`. Connection URLs come from env (`PAGILA_DATABASE_URL`, `SAKILA_DATABASE_URL`), not from the DSL file.

## Example DSL

[`./pagila.db2ai`](./pagila.db2ai) and [`./sakila.db2ai`](./sakila.db2ai) — table tools (`listFilms`, …) with `limit` / `offset`, optional `columns { … }`, and `SQL { … }` tools with logical `$1`, `$2`, …

## MCP server

| Server         | Auth                  | Prerequisite                                           |
| -------------- | --------------------- | ------------------------------------------------------ |
| `db2ai-pagila` | PostgreSQL URL in env | `db:pagila:up`, generated tools, `PAGILA_DATABASE_URL` |
| `db2ai-sakila` | MySQL URL in env      | `db:sakila:up`, generated tools, `SAKILA_DATABASE_URL` |

## Demo prompts

Prefix with **`db2ai`**.

- Pagila only: `db2ai nutze Pagila: gib mir 20 R rated Filme`
- Sakila only: `db2ai nutze Sakila: gib mir 20 R rated Filme`
- Same search, chosen server: `db2ai nutze Pagila: suche in den Filmen nach grace`
- Actor query: `db2ai nutze Sakila: in welchen Filmen spielt Penelope Guiness mit?`
- Compare both: `db2ai vergleiche Pagila und Sakila: suche Filme mit academy auf beiden Servern`

List tools (`listFilms`, `listActors`, …) use pagination (`limit` default 100, `offset` 0).

---

#Col3:23
