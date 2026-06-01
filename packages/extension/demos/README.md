# db2ai MCP demos

Demo workspace for **db2ai** MCP examples: `.db2ai` files, generated tools, and [`.cursor/mcp.json`](./.cursor/mcp.json). Project repo: [db2ai](https://github.com/annettodorothea/db2ai/blob/main/README.md).

## Quick start

1. **`npm run init`** — creates `.env` from `.env.example` if missing, `npm install`, `db:up:all`, `generate:all`, `build:generated` (requires **Docker Desktop**).
2. Edit **`.env`** for database URLs and optional tokens (see [Credentials and env](#credentials-and-env)).
3. Open **this folder** as the Cursor/VS Code workspace. Enable **`db2ai-pagila`**, **`db2ai-sakila`**, and/or **`db2ai-access-demo`** under **Tools & MCP**.
4. After DSL changes, generate/build, or env vars read at MCP startup: **reload** the affected MCP server.

## How it works

- You author **`.db2ai`** SQL tool definitions (`database env "…"` / `database mysql env "…"`).
- The **db2ai** extension or CLI generates **`generated/tools/*.ts`** and **`generated/cli/mcp-serve.ts`**.
- **`npm run build:generated`** compiles **`generated/cli/mcp-serve.js`** for MCP.
- [`.cursor/mcp.json`](./.cursor/mcp.json) starts `mcp-serve.js` per server over **stdio** and loads the matching tool module.

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

| DSL file            | MCP server          | Prerequisite                                    |
| ------------------- | ------------------- | ----------------------------------------------- |
| `pagila.db2ai`      | `db2ai-pagila`      | `db:pagila:up`, `PAGILA_DATABASE_URL`           |
| `sakila.db2ai`      | `db2ai-sakila`      | `db:sakila:up`, `SAKILA_DATABASE_URL`           |
| `access-demo.db2ai` | `db2ai-access-demo` | `db:access-demo:up`, `ACCESS_DEMO_DATABASE_URL` |

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

## MCP servers

| Server              | Auth / env                                      | Prerequisite                                |
| ------------------- | ----------------------------------------------- | ------------------------------------------- |
| `db2ai-pagila`      | `PAGILA_DATABASE_URL`, `DB2AI_AUTH_TOKEN`       | Pagila up; token for `protected` tools      |
| `db2ai-sakila`      | `SAKILA_DATABASE_URL`, `DB2AI_AUTH_TOKEN`       | Sakila up; token for `protected` tools      |
| `db2ai-access-demo` | `ACCESS_DEMO_DATABASE_URL`, `ACCESS_DEMO_TOKEN` | access-demo up; token for protected/checked |

Argument order in `mcp.json`: `mcp-serve.js`, tool module, then `--auth-env` (see [`.env.example`](./.env.example)).

## Credentials and env

Env file: **`.env`** (from `.env.example` via `init`). Database URLs are read when the MCP server starts — reload MCP after changing them.

### Local backend

Demo databases run via **Docker Compose** (`init` runs **`db:up:all`**). Images: [Pagila](https://hub.docker.com/r/synthesizedio/pagila), [Sakila MySQL](https://hub.docker.com/r/sakiladb/mysql), access-demo `postgres:16-alpine` + [`access-demo/init.sql`](./access-demo/init.sql).

First start can take about a minute. Schema/init runs only on first volume create — use **`db:*:reset`** after schema changes.

### Demo tokens

| Variable            | Use                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `DB2AI_AUTH_TOKEN`  | Pagila/Sakila **`protected`** tools (e.g. `listActors`)                                  |
| `ACCESS_DEMO_TOKEN` | access-demo **`protected`** / **`checked`** (not required for `listProducts` / `public`) |

access-demo JWT lines in [`.env.example`](./.env.example) (alice / bob / admin). Switch by commenting lines — no MCP restart needed for token-only changes on access-demo.

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
- **Port in use:** override `PAGILA_HOST_PORT`, `SAKILA_HOST_PORT`, or `ACCESS_DEMO_HOST_PORT` and update URLs in `.env`.
- **Schema changed after pull:** `npm run db:access-demo:reset` (or `db:pagila:reset` / `db:sakila:reset`).
- **Database URL changed in `.env`:** reload the matching MCP server.
- **Missing credential on tool call:** set `DB2AI_AUTH_TOKEN` or `ACCESS_DEMO_TOKEN` for protected/checked tools.

## Development

From the **db2ai** monorepo root:

```bash
npm test --prefix packages/extension/demos
```

---

#Col3:23
