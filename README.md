# db2ai

> **Pre-release** — early access; APIs, DSL, and generated output may change before v1.0.

## Turn your database into AI-ready tools.

Generate MCP-compatible tools from SQL queries without writing custom MCP servers.

db2ai lets you define SQL-based tools, enrich them with AI-friendly metadata, and generate MCP tools that can be used by AI agents.

Perfect for exposing existing business data to Claude, ChatGPT, Cursor, and other MCP-compatible runtimes.

---

## Get Started

The fastest way to try db2ai is with the VSIX extension and the bundled demo workspace.

### 1. Install the VSIX

Download the latest release:

https://github.com/annettedorothea/db2ai/releases

### 2. Create a Demo Workspace

Open Cursor or VS Code and run:

```text
db2ai: Create demo workspace (MCP examples)
```

### 3. Explore

Open any `.db2ai` file, make a change, and save.

db2ai automatically validates your SQL and generates MCP-compatible tools.

No repository checkout required.

---

## Example

```db2ai
database postgres env "PAGILA_DATABASE_URL"

SQL {
    toolName: listFilms
    access: public
    intent: "list films from Pagila with pagination"
    query: "SELECT * FROM film LIMIT LEAST(:limit, 500) OFFSET :offset"
    params: {
        limit: { description: "max rows per page" example: "100" type: integer }
        offset: { description: "rows to skip" example: "0" type: integer }
    }
}
```

```text
Database
    ↓
.db2ai
    ↓
MCP Tool
    ↓
AI Agent
```

---

## Why db2ai?

Building MCP tools for databases usually requires:

- writing SQL wrappers
- implementing tool definitions
- maintaining MCP server code
- keeping database access and tool descriptions in sync

db2ai lets you focus on describing business capabilities instead of writing boilerplate.

Queries are validated against a live database using dry-run probes (`EXPLAIN` / compile-only checks; no data changes) before tools are generated.

---

## Supported database dialects

- PostgreSQL
- MySQL
- MariaDB
- SQL Server
- Oracle

---

## Documentation

The architecture behind db2ai is documented in core2ai:

- Tool Factory
- Tool Authoring
- AI Runtime
- Personas

https://github.com/annettedorothea/core2ai/tree/main/docs

---

## Related Projects

- **core2ai** – shared runtime and platform architecture
- **api2ai** – generate MCP tools from OpenAPI specifications

---

## License

BUSL-1.1

---

#Col3:23
