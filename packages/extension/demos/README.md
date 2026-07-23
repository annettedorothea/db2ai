# db2ai Demo Workspace

Welcome to the `db2ai` demo workspace.

This workspace contains examples that demonstrate database-backed MCP tools, authentication, authorization, and integration patterns.

If this is your first time using `db2ai`, start with the PostgreSQL or MySQL examples.

---

## Quick Start

### 1. Start the demo environment

Make sure Docker Desktop is running.

To start everything:

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

Using the `db2ai` prefix helps Cursor focus on generated MCP tools and avoid unrelated built-in tools.

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

Before release, run:

```text
/test-all
```

or:

```text
db2ai /test-all
```

For HTTP transport debugging — hosts must already be running (`npm run start:all`). Prefer this as the **manual verify** for generated HTTP MCP tools:

```bash
npm run mcp:inspect -- pagila-postgresql
npm run mcp:inspect -- orders-postgresql
```

Prerequisites:

- `npm run start:all`
- MCP servers enabled in `.cursor/mcp.json`
- OAuth login completed where required

The demo workspace includes the skill:

```text
db2ai-test-all-mcp
```

---

## Bundling an MCP Server

Generated MCP hosts can be bundled into standalone deployment packages.

Example:

    npm run build:generated
    npm run build:mcp -- --host public-http animals-sqlserver

This creates a distributable MCP bundle in:

    dist/mcp/animals-sqlserver-public-http/

Depending on the selected host type, configure environment variables before starting the server.

From the bundle directory:

```bash
cd dist/mcp/animals-sqlserver-public-http
npm install
cp .env.example .env
npm start
```

`npm start` runs `server.mjs` with the demo flags from `build:mcp` (`--port`, `--path`; api2ai-style hosts also pass `--base-url-env`). Database modules use `connectionEnv` from the generated tools module instead of `--base-url-env`. DuckDB demos (`flight`, `sales-report`) copy their CSV/Excel folders next to `server.mjs` so file paths work in the bundle.

Edit `.env` if you need to change upstream URLs, ports, or credentials.

The bundle contains:

- the MCP server runtime
- generated tools
- a minimal `package.json`
- `.env.example`
- `mcp.json.example`

Supported host types:

- `public-http`
- `passthrough-http`
- `oauth-http`

This feature is still evolving and may change before the final `1.0` release.

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
