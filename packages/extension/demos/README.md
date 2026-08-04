# db2ai Demo Workspace

Welcome to the `db2ai` demo workspace.

This workspace contains examples that demonstrate database-backed MCP tools, authentication, authorization, and integration patterns.

If this is your first time using `db2ai`, start with the PostgreSQL or MySQL examples.

---

## Quick Start

### 1. Start the demo environment

Make sure Docker Desktop is running. From the demo workspace root, pick one path:

#### Cursor

HTTP MCP hosts (leave the terminal open):

```bash
npm run start:all
```

This command starts:

- all demo databases (background via `start:fixtures`)
- OAuth identity providers (background)
- generated MCP hosts (foreground — leave this terminal open)
- supporting services required by the demos

For MCP-only restarts after DSL or codegen changes (DBs and IdP already running):

```bash
npm run start:mcp
```

(`npm run start` is an alias for `start:mcp`.)

#### VS Code

stdio MCP only (see [`.vscode/mcp.json`](.vscode/mcp.json); no HTTP hosts):

```bash
npm run start:all:vscode
```

This command:

- installs missing dependencies
- generates tool code
- compiles generated files
- starts demo backends (background)

It does **not** start HTTP MCP hosts. VS Code / Copilot spawns stdio servers from `.vscode/mcp.json`. The OAuth demo (`orders-postgresql`) is omitted there. Do not use the HTTP entries from [`.cursor/mcp.json`](.cursor/mcp.json) for Copilot.

---

### 2. Open a demo

Examples include:

- `pagila-postgresql.db2ai`
- `sakila-mysql.db2ai`

Save the file to generate the MCP server.

---

### 3. Ask your AI assistant

Examples:

```text
db2ai Show the ten most frequently rented movies.

db2ai Which actors appeared in the most films?

db2ai Which customers generated the highest revenue last month?
```

Using the `db2ai` prefix helps the assistant focus on generated MCP tools and avoid unrelated built-in tools.

In VS Code, use **Agent** mode in Copilot Chat and enable the stdio servers listed in `.vscode/mcp.json`.

---

## Learning Path

1. `pagila-postgresql.db2ai`
   PostgreSQL read tools with public access.

2. `sakila-mysql.db2ai`
   MySQL equivalent of the Sakila example.

3. `orders-postgresql.db2ai`
   Protected tools using OAuth MCP, `checkToolAccess`, and `prepareToolCall` with `clientMayOmit`.

Authoring documentation: [Documentation index](https://github.com/annettedorothea/core2ai/blob/main/docs/README.md)

---

## Available Demos

| Demo                      | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| `pagila-postgresql.db2ai` | PostgreSQL demo database                                |
| `sakila-mysql.db2ai`      | MySQL demo database                                     |
| `sakila-mariadb.db2ai`    | MariaDB example                                         |
| `animals-sqlserver.db2ai` | SQL Server example                                      |
| `plants-oracle.db2ai`     | Oracle example                                          |
| `orders-postgresql.db2ai` | OAuth-protected PostgreSQL example                      |
| `flight.db2ai`            | DuckDB in-memory over CSV (`flights/`) via initDatabase |
| `sales-report.db2ai`      | DuckDB in-memory over messy Excel via initDatabase      |

Demos cover:

- PostgreSQL
- MySQL
- MariaDB
- SQL Server
- Oracle
- DuckDB (CSV / Excel file sources; no Docker DB)

---

## Testing

### Test-All Skill in Cursor

To exercise every configured MCP tool once in Cursor (after `npm run start:all` and with servers enabled in `.cursor/mcp.json`):

```text
/test-all
```

### MCP Inspector

For **HTTP** MCP hosts only (not stdio). After `npm run start:all`, you can inspect any server from `.cursor/mcp.json`, e.g.:

```bash
npm run mcp:inspect -- pagila-postgresql
npm run mcp:inspect -- orders-postgresql
```

---

## Bundling an MCP Server

Build a standalone package for a generated host, e.g.:

```bash
npm run build:generated
npm run build:mcp -- --host public-http animals-sqlserver
```

Output: `dist/mcp/animals-sqlserver-public-http/` (runtime, tools, `package.json`, `.env.example`, `mcp.json.example`).

```bash
cd dist/mcp/animals-sqlserver-public-http
npm install
cp .env.example .env
npm start
```

`npm start` runs `server.mjs` with the flags from `build:mcp` (`--port`, `--path`). Database modules use `connectionEnv` from the generated tools (not `--base-url-env`). DuckDB demos (`flight`, `sales-report`) include their CSV/Excel folders next to `server.mjs`.

Host types: `public-http`, `passthrough-http`, `oauth-http`.

---

## Documentation

[Documentation index](https://github.com/annettedorothea/core2ai/blob/main/docs/README.md) — architecture, authoring, runtime, and integrations.

---

## Related Projects

- https://github.com/annettedorothea/core2ai
- https://github.com/annettedorothea/api2ai

---

## Feedback

Share onboarding and integration feedback in [GitHub Discussions](https://github.com/annettedorothea/db2ai/discussions/1). For bugs, open an [Issue](https://github.com/annettedorothea/db2ai/issues).

---

> _Whatever you do, work heartily, as for the Lord and not for men._
>
> **— Colossians 3:23**
>
> _Created by Annette Pohl_
