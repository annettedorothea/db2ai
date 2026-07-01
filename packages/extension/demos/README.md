# db2ai Demo Workspace

Welcome to the `db2ai` demo workspace.

This workspace contains examples that demonstrate database-backed MCP tools, authentication, and integration patterns.

If this is your first time using `db2ai`, start with the Sakila examples.

---

## Quick Start

### 1. Start a demo database

Make sure Docker Desktop is running.

Then start one of the demo databases:

```bash
npm run start:sakila-mysql
```

or

```bash
npm run start:pagila-postgresql
```

---

### 2. Open a demo

Examples include:

- `sakila-mysql.db2ai`
- `pagila-postgresql.db2ai`

Save the file to generate the MCP server.

---

### 3. Ask your AI assistant

Examples:

```text
db2ai Show the ten most frequently rented movies.

db2ai Which actors appeared in the most films?

db2ai Which customers generated the highest revenue last month?
```

Using the `db2ai` prefix helps Cursor focus on the generated MCP tools and avoid unrelated built-in tools.

---

## Documentation

Looking for architecture, authentication, MCP concepts, integrations, or development guides?

See the shared documentation in:

https://github.com/annettedorothea/core2ai

---

## Related Projects

- https://github.com/annettedorothea/core2ai
- https://github.com/annettedorothea/api2ai

---

> _Whatever you do, work heartily, as for the Lord and not for men._
>
> **— Colossians 3:23**
>
> _Created by Annette Pohl_
