# db2ai

Editor support for the **`.db2ai` DSL**: syntax highlighting, validation, schema-aware completion, and **generate on save** (TypeScript/ESM tool modules + MCP host).

Curate `SELECT` queries or `SQL { … }` blocks into MCP tools — the full project (DSL, CLI, Pagila examples) lives in the [db2ai](https://github.com/annettedorothea/db2ai) monorepo. Sibling: [api2ai](https://github.com/annettedorothea/api2ai) (OpenAPI → MCP).

## Requirements

- VS Code or Cursor **1.67+**
- Node.js **20+** where you generate tools (MCP runtime: `@modelcontextprotocol/sdk`, `zod`, `pg`)
- Docker Desktop for the Pagila demo DB (`cd examples && npm run db:up`) — used for schema validation/completion

## Usage

1. Open a workspace with `.db2ai` files.
2. Set `database env "YOUR_VAR"` and define `YOUR_VAR` in `.env` (e.g. `PAGILA_DATABASE_URL`).
3. Edit `.db2ai` — on **save**, output under `generated/tools/` and `generated/cli/mcp-serve.mjs`.
4. Command Palette: **Generate tool code (.ts + .mjs + MCP host)**.

## License

MIT — Copyright (c) Annette Pohl. Full license text is included in the VSIX (`LICENSE` file, copied from the db2ai repository root when you run `npm run extension:vsix`).
