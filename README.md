# db2ai

Geschwisterprojekt zu [api2ai](../api2ai): Langium-DSL für relationale Datenbanken → MCP-Tools (`.db2ai`).

## Status (Skelett)

- Monorepo: `packages/language`, `packages/cli`, `packages/extension`
- DSL v1: `database` + `SELECT * FROM <table>` + Tool-Metadaten; Schema-Validierung/Completion via PostgreSQL
- CLI: `parse`, `validate` (kein Codegen)
- LSP-Debug-Port: **6010** (api2ai nutzt 6009)

## Entwicklung

```bash
npm install
npm run langium:generate && npm run build
npm test
```

### Test-Datenbank (PostgreSQL / Pagila, lokal)

```bash
cd examples && npm run db:setup
```

Voraussetzung: PostgreSQL auf dem Rechner (z. B. `brew install postgresql@16`). Details: [`examples/README.md`](examples/README.md).

Extension debuggen: F5 **Run db2ai Extension** (`.vscode/launch.json`), oder [`../mcp-dsls.code-workspace`](../mcp-dsls.code-workspace) für beide Projekte im Explorer.

### Language-Server debuggen

1. F5 **Run db2ai Extension**
2. **Attach to Language Server** (Port `6010`) — im Workspace: *Attach: db2ai Language Server (6010)*
