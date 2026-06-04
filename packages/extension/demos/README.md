# db2ai MCP demos

Demo workspace for **db2ai** MCP examples: `.db2ai` files, generated tools, and [`.cursor/mcp.json`](./.cursor/mcp.json). Project repo: [db2ai](https://github.com/annettodorothea/db2ai/blob/main/README.md).

## Quick start

1. **`npm run init`** — creates `.env` from `.env.example` if missing, `npm install`, `db:up:all`, `generate:all`, `build:generated` (requires **Docker Desktop**).
2. Edit **`.env`** / **`.env.local`** for tokens (see [Credentials and env](#credentials-and-env)).
3. Open **this folder** as the Cursor/VS Code workspace. Enable one MCP server per demo (`stdio-db2ai-*` or `http-db2ai-*`) under **Tools & MCP**.
4. After DSL changes, generate/build, or env vars read at MCP startup: **reload** the affected MCP server.

## How it works

- You author **`.db2ai`** SQL tool definitions (`database env "…"` / `database mysql env "…"`).
- The **db2ai** extension or CLI generates **`generated/tools/*.ts`** and **`generated/cli/stdio-mcp-server.ts`**.
- **`npm run build:generated`** compiles **`generated/cli/*.js`** for MCP.
- [`.cursor/mcp.json`](./.cursor/mcp.json) lists **stdio** and **HTTP** (`url`) per demo; enable one transport at a time in Cursor.

## Example DSL

```db2ai
database env "PAGILA_DATABASE_URL"

SQL {
    toolName: listFilms
    access: public
    intent: "list films from Pagila with pagination"
    query: "SELECT * FROM film LIMIT LEAST($1, 500) OFFSET $2"
    summary: "Paginated film rows"
    params: {
        $1: { name: limit description: "max rows" example: "100" type: integer }
        $2: { name: offset description: "rows to skip" example: "0" type: integer }
    }
}
```

Text fields accept `"…"` or multiline `'''…'''`. PostgreSQL: one bind per `$n`; MySQL: one bind per `?`. See [`access-demo.db2ai`](./access-demo.db2ai) for `auth` / `checked`.

## Demo files

| DSL file            | MCP server (stdio / http)                            | Prerequisite                                 |
| ------------------- | ---------------------------------------------------- | -------------------------------------------- |
| `pagila.db2ai`      | `stdio-db2ai-pagila` / `http-db2ai-pagila`           | `db:pagila:up`; HTTP: `demo:mcp-http:pagila` |
| `sakila.db2ai`      | `stdio-db2ai-sakila` / `http-db2ai-sakila`           | `db:sakila:up`; HTTP: `demo:mcp-http:sakila` |
| `access-demo.db2ai` | `stdio-db2ai-access-demo` / `http-db2ai-access-demo` | `db:access-demo:up`; HTTP host script        |

## Scripts

| Script                                                         | Purpose                                                      |
| -------------------------------------------------------------- | ------------------------------------------------------------ |
| `init`                                                         | Env from example, install, all DBs up, generate all, compile |
| `db:up:all`                                                    | Start Pagila, Sakila, access-demo containers                 |
| `db:pagila:up` / `db:sakila:up` / `db:access-demo:up`          | Start one database                                           |
| `db:down`                                                      | Stop all demo containers                                     |
| `db:*:reset`                                                   | Recreate container and data                                  |
| `generate:all`                                                 | Regenerate all demo tool modules                             |
| `generate:pagila` / `generate:sakila` / `generate:access-demo` | Single demo                                                  |
| `build:generated`                                              | Compile `generated/**/*.ts` → `.js` for MCP                  |
| `demo:mcp-http:all`                                            | Start all HTTP MCP hosts in background (3852–3854)           |
| `demo:mcp-http:kill`                                           | Stop processes on those HTTP MCP ports                       |
| `demo:mcp-http:pagila` / `sakila` / `access-demo`              | Start one HTTP MCP host in foreground (see below)            |

## Stateless HTTP MCP

[`mcp.json`](./.cursor/mcp.json): fixed `"url"` values (no `${env:…}`). Database URLs for HTTP hosts come from `.env` / `.env.local` when you start the host; committed `mcp.json` only carries demo-default connection strings on **stdio** entries.

| Script                      | MCP server (Cursor)      | Port |
| --------------------------- | ------------------------ | ---- |
| `demo:mcp-http:access-demo` | `http-db2ai-access-demo` | 3852 |
| `demo:mcp-http:pagila`      | `http-db2ai-pagila`      | 3853 |
| `demo:mcp-http:sakila`      | `http-db2ai-sakila`      | 3854 |

```bash
npm run db:up:all
npm run demo:mcp-http:all
```

Stop: `npm run demo:mcp-http:kill`. Enable the matching `http-db2ai-*` servers in Cursor and reload MCP.

- **Pagila / Sakila protected tools:** stdio with `DB2AI_AUTH_TOKEN` in `.env.local`, or HTTP with `x-api-token` in Cursor MCP UI (no demo JWT in `mcp.json`).
- **access-demo HTTP:** demo **bob** JWT in `headers.x-api-token` in `mcp.json`; stdio uses `ACCESS_DEMO_TOKEN` in `.env.local`.

## MCP servers

| Server                    | Transport | Auth / env                                                                  | Prerequisite   |
| ------------------------- | --------- | --------------------------------------------------------------------------- | -------------- |
| `stdio-db2ai-pagila`      | stdio     | `PAGILA_DATABASE_URL` in mcp.json; `DB2AI_AUTH_TOKEN` in `.env.local`       | Pagila up      |
| `http-db2ai-pagila`       | http      | host `demo:mcp-http:pagila`; protected: `x-api-token` in MCP UI or stdio    | Pagila up      |
| `stdio-db2ai-sakila`      | stdio     | `SAKILA_DATABASE_URL` in mcp.json; `DB2AI_AUTH_TOKEN` in `.env.local`       | Sakila up      |
| `http-db2ai-sakila`       | http      | host `demo:mcp-http:sakila`; protected: `x-api-token` in MCP UI or stdio    | Sakila up      |
| `stdio-db2ai-access-demo` | stdio     | `ACCESS_DEMO_DATABASE_URL` in mcp.json; `ACCESS_DEMO_TOKEN` in `.env.local` | access-demo up |
| `http-db2ai-access-demo`  | http      | host `demo:mcp-http:access-demo`; demo bob JWT in `mcp.json` `headers`      | access-demo up |

Argument order in `mcp.json`: `stdio-mcp-server.js`, tool module, then `--auth-env` (see [`.env.example`](./.env.example)).

## Credentials and env

Env file: **`.env`** (from `.env.example` via `init`); secrets in **`.env.local`** (`envFile` on stdio servers). Database URLs are read when the MCP server starts — reload MCP after changing them.

### Local backend

Demo databases run via **Docker Compose** (`init` runs **`db:up:all`**). Images: [Pagila](https://hub.docker.com/r/synthesizedio/pagila), [Sakila MySQL](https://hub.docker.com/r/sakiladb/mysql), access-demo `postgres:16-alpine` + [`access-demo/init.sql`](./access-demo/init.sql).

First start can take about a minute. Schema/init runs only on first volume create — use **`db:*:reset`** after schema changes.

### Demo tokens

| Variable            | Use                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `DB2AI_AUTH_TOKEN`  | Pagila/Sakila **`protected`** tools (e.g. `listActors`)                                  |
| `ACCESS_DEMO_TOKEN` | access-demo **`protected`** / **`checked`** (not required for `listProducts` / `public`) |

access-demo JWT lines in [`.env.example`](./.env.example) (alice / bob / admin). Switch by commenting lines — no MCP restart needed for token-only changes on access-demo stdio.

### Dev TLS

Bundled SQL demos use database URLs from `.env` (typically `postgresql://` / `mysql://` on localhost). No TLS override in generated code.

## Example prompts

Use prefix **`db2ai`** in chat ([`./.cursor/rules/mcp-db2ai-only.mdc`](./.cursor/rules/mcp-db2ai-only.mdc)).

| Scenario     | Prompt                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| Pagila films | `db2ai nutze Pagila: gib mir 20 R rated Filme`                                   |
| Sakila films | `db2ai nutze Sakila: gib mir 20 R rated Filme`                                   |
| Search       | `db2ai nutze Pagila: suche in den Filmen nach grace`                             |
| Compare      | `db2ai vergleiche Pagila und Sakila: suche Filme mit academy auf beiden Servern` |
| access-demo  | `db2ai nutze access-demo: liste Produkte`                                        |

## Troubleshooting

- **Connection refused:** run matching `db:*:up` or `init`; check Docker Desktop.
- **Port in use:** override `*_HTTP_PORT` in `.env` and update matching `url` in local `mcp.json` if needed.
- **Schema changed after pull:** `npm run db:access-demo:reset` (or `db:pagila:reset` / `db:sakila:reset`).
- **Database URL changed in `.env`:** reload the matching MCP server (stdio) or restart HTTP host.
- **Missing credential on tool call:** set `DB2AI_AUTH_TOKEN` or `ACCESS_DEMO_TOKEN` for protected/checked tools.

## Development

From the **db2ai** monorepo root:

```bash
npm test --prefix packages/extension/demos
```

---

#Col3:23
