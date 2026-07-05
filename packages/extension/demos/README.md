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

- all demo databases
- OAuth identity providers
- generated MCP hosts
- supporting services required by the demos

If you only want a single database, you can start it individually:

```bash
npm run start:pagila-postgresql
```

or

```bash
npm run start:sakila-mysql
```

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

| Demo                      | Description                        |
| ------------------------- | ---------------------------------- |
| `pagila-postgresql.db2ai` | PostgreSQL demo database           |
| `sakila-mysql.db2ai`      | MySQL demo database                |
| `sakila-mariadb.db2ai`    | MariaDB example                    |
| `animals-sqlserver.db2ai` | SQL Server example                 |
| `plants-oracle.db2ai`     | Oracle example                     |
| `orders-postgresql.db2ai` | OAuth-protected PostgreSQL example |

Demos cover:

- PostgreSQL
- MySQL
- MariaDB
- SQL Server
- Oracle

Start the matching database before opening a demo:

```bash
npm run start:pagila-postgresql
npm run start:sakila-mysql
npm run start:animals-sqlserver
npm run start:plants-oracle
```

or simply:

```bash
npm run start:all
```

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

Prerequisites:

- databases running
- MCP hosts running
- OAuth login completed where required

The demo workspace includes the skill:

```text
db2ai-test-all-mcp
```

---

## Documentation

[Documentation index](https://github.com/annettedorothea/core2ai/blob/main/docs/README.md) — architecture, authoring, runtime, and integrations.

---

## Related Projects

- https://github.com/annettedorothea/core2ai
- https://github.com/annettedorothea/api2ai

---

## Feedback

**1.0.0-rc** — share onboarding and integration feedback in [GitHub Discussions](https://github.com/annettedorothea/db2ai/discussions/1). For bugs, open an [Issue](https://github.com/annettedorothea/db2ai/issues).

---

> _Whatever you do, work heartily, as for the Lord and not for men._
>
> **— Colossians 3:23**
>
> _Created by Annette Pohl_
