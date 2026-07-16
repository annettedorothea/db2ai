# db2ai

> Generate curated MCP tools from relational databases.

## Ecosystem

| Repository                                            | Purpose                                                |
| ----------------------------------------------------- | ------------------------------------------------------ |
| [core2ai](https://github.com/annettedorothea/core2ai) | Shared runtime, architecture, and documentation        |
| [api2ai](https://github.com/annettedorothea/api2ai)   | Generate curated MCP tools from OpenAPI specifications |
| [db2ai](https://github.com/annettedorothea/db2ai)     | Generate curated MCP tools from relational databases   |

Instead of hand-writing MCP servers, define the SQL queries you want as tools, enrich them in `.db2ai`, and generate executable MCP tooling.

You curate which queries become tools — not every table or statement is exposed automatically.

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

The demo workspace includes PostgreSQL, MySQL, MariaDB, SQL Server, and Oracle examples.

---

## How it works

```text
Database Schema
        │
        ▼
   select & enrich
        │
        ▼
     .db2ai
        │
        ▼
Generated MCP Server
        │
        ▼
Cursor • ChatGPT • Claude • MCP Inspector
```

Example:

```text
database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"

auth

SQL {
    toolName: listFilms
    access: protected
    hooks: {
        prepareToolCall: true
    }
    intent: "list films with pagination"
    query: "SELECT * FROM film LIMIT LEAST(:limit, 100) OFFSET :offset"
    params: {
        limit: { description: "max rows per page" example: "100" type: integer }
        offset: { description: "rows to skip" example: "0" type: integer }
    }
}
```

---

## Documentation

[Documentation index](https://github.com/annettedorothea/core2ai/blob/main/docs/README.md) — architecture, authoring, runtime, and integrations.

See [CHANGELOG.md](CHANGELOG.md) for version history and upgrade notes.

---

## Related Projects

- [core2ai](https://github.com/annettedorothea/core2ai) — Shared runtime, code generation infrastructure, and documentation.
- [api2ai](https://github.com/annettedorothea/api2ai) — Generate curated MCP tools from OpenAPI specifications.

---

## Feedback

We welcome feedback on onboarding, documentation, DSL ergonomics, and MCP integration. Share your experience in [GitHub Discussions](https://github.com/annettedorothea/db2ai/discussions/1). For bugs, open an [Issue](https://github.com/annettedorothea/db2ai/issues).

---

## License

MIT — see [LICENSE](LICENSE).

---

> _Whatever you do, work heartily, as for the Lord and not for men._
>
> **— Colossians 3:23**
>
> _Created by Annette Pohl_
