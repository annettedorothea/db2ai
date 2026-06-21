# db2ai MCP demos

> **Pre-release** — demo workspace for trying db2ai; not a stability guarantee for production.

**Prerequisite:** demo workspace created via **db2ai: Create demo workspace** (VSIX extension).

[`.cursor/mcp.json`](./.cursor/mcp.json) · `.db2ai` workspace root

## Quick start

**Goal:** call one MCP tool from Cursor (`sakila-mysql`, MySQL Sakila sample DB).

1. **Docker Desktop** is running
2. Terminal in this folder:

```bash
npm install && npm run start:sakila-mysql
```

(`start:sakila-mysql` also runs `npm install` if you skip the line above — then Sakila container, generate, compile; does not start other databases)

3. Cursor → **Settings → Tools & MCP** → enable only **`sakila-mysql`** → **Reload MCP**
4. Chat (copy-paste — prefix **`db2ai`** activates the demo MCP rule):

```text
db2ai List five films from the Sakila database.
```

## What's next

| Step | MCP server          | Command                           | Notes                                                                                               |
| ---- | ------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1    | `sakila-mariadb`    | —                                 | Same MySQL container as `sakila-mysql`; enable server only                                          |
| 2    | `pagila-postgresql` | `npm run start:pagila-postgresql` | PostgreSQL + HTTP passthrough host                                                                  |
| 3    | `orders-postgresql` | `npm run start:orders-postgresql` | PostgreSQL + OAuth IDP + HTTP host; Cursor Sign-in                                                  |
| 4    | `animals-sqlserver` | `npm run start:animals-sqlserver` | SQL Server (stdio)                                                                                  |
| 5    | `plants-oracle`     | `npm run start:plants-oracle`     | Oracle — first pull can take several minutes; one-time `docker login container-registry.oracle.com` |
| 6    | all demos           | `npm run start:all`               | Full stack for `/test-all` (stops other demos first)                                                |

Per-demo starts do **not** stop databases or MCP hosts from other demos already running.

## All demos

| MCP server          | DSL               | Database                         | Transport          | Port | Start command                     |
| ------------------- | ----------------- | -------------------------------- | ------------------ | ---- | --------------------------------- |
| `sakila-mysql`      | sakila-mysql      | MySQL (Sakila)                   | stdio              | —    | `npm run start:sakila-mysql`      |
| `sakila-mariadb`    | sakila-mariadb    | MariaDB (Sakila, same container) | stdio              | —    | (DB via `start:sakila-mysql`)     |
| `pagila-postgresql` | pagila-postgresql | PostgreSQL (Pagila)              | HTTP (passthrough) | 4853 | `npm run start:pagila-postgresql` |
| `orders-postgresql` | orders-postgresql | PostgreSQL (orders)              | HTTP (oauth)       | 4871 | `npm run start:orders-postgresql` |
| `animals-sqlserver` | animals-sqlserver | SQL Server (animals)             | stdio              | —    | `npm run start:animals-sqlserver` |
| `plants-oracle`     | plants-oracle     | Oracle (plants)                  | stdio              | —    | `npm run start:plants-oracle`     |

Database URLs in **`.env`** (see `.env.example`). Protected/checked tools: `src/auth/db2ai/<module>/verify*Credentials.ts`.

## Scripts

| Command                      | Purpose                                                      |
| ---------------------------- | ------------------------------------------------------------ |
| `npm run start:sakila-mysql` | `npm install` + Sakila DB + generate + compile (quick start) |
| `npm run start:<demo>`       | One demo (see table above)                                   |
| `npm run start:all`          | All DBs + all MCP/IDP hosts (`npm run start` alias)          |
| `npm run start:foreground`   | `start:all` with logs in this terminal                       |
| `npm run demo:kill-all`      | Stop MCP, IDP, and all Docker demo DBs                       |
| `npm run db:down`            | Stop Docker containers only                                  |

Reload MCP after `.db2ai`, `mcp.json`, or `.env` changes.

Servers for demos you have not started yet (`start:<demo>` or `start:all`) may show errors in MCP settings — that is expected; only enable what is running, or run **`npm run start:all`** before `/test-all`.

## Chat prefix

Begin prompts with **`db2ai`** (e.g. `db2ai List five films…`) so the workspace rule applies and the agent uses only your configured MCP servers—not web search or other tools.

---

#Col3:23
