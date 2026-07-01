# db2ai

> Generate curated MCP tools from relational databases.

> **Pre-release**
> APIs, the DSL, and generated output may change before v1.0.

## Ecosystem

| Repository                                            | Purpose                                                |
| ----------------------------------------------------- | ------------------------------------------------------ |
| [core2ai](https://github.com/annettedorothea/core2ai) | Shared runtime, architecture, and documentation        |
| [api2ai](https://github.com/annettedorothea/api2ai)   | Generate curated MCP tools from OpenAPI specifications |
| [db2ai](https://github.com/annettedorothea/db2ai)     | Generate curated MCP tools from relational databases   |

Instead of writing and maintaining custom MCP servers by hand, describe your database access once and let `db2ai` generate the tooling for you.

---

## Quick Start

The easiest way to explore `db2ai` is with the VSIX extension and the bundled demo workspace.

### 1. Install the extension

Download the latest VSIX from the GitHub releases page:

https://github.com/annettedorothea/db2ai/releases

### 2. Create a demo workspace

In Cursor or VS Code, run:

```text
db2ai: Create demo workspace (MCP examples)
```

### 3. Start your first MCP server

Open the generated [Demo Workspace README](packages/extension/demos/README.md) and follow the Quick Start.

The demo workspace contains examples for PostgreSQL and MySQL.

---

## How it works

```text
Database Schema
        │
        ▼
     .db2ai
        │
        ▼
Generated MCP Server
        │
        ▼
Cursor • ChatGPT • Claude • Open WebUI
```

Example:

```text
database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"

tool actorsByLastName {
    description: "Find actors by last name"

    input {
        lastName string
    }

    sql {
        SELECT *
        FROM actor
        WHERE last_name = :lastName
    }
}
```

---

## Documentation

Looking for architecture, authentication, MCP concepts, integrations, or development guides?

See the shared documentation in [core2ai](https://github.com/annettedorothea/core2ai):

- [Documentation index](https://github.com/annettedorothea/core2ai/blob/main/docs/README.md)

---

## Related Projects

- [core2ai](https://github.com/annettedorothea/core2ai) — Shared runtime, code generation infrastructure, and documentation.
- [api2ai](https://github.com/annettedorothea/api2ai) — Generate curated MCP tools from OpenAPI specifications.

---

## License

MIT — see [LICENSE](LICENSE).

Questions, ideas, bug reports, and feature requests are always welcome through GitHub Discussions or Issues.

---

> _Whatever you do, work heartily, as for the Lord and not for men._
>
> **— Colossians 3:23**
>
> _Created by Annette Pohl_
