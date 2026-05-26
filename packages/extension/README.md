# db2ai

Editor support for the **`.db2ai` DSL**: syntax highlighting, validation, schema-aware completion, and **generate on save** (TypeScript/ESM tool modules + MCP host).

The full project (DSL, CLI, demos) lives in the [db2ai](https://github.com/annettodorothea/db2ai) repository. Sibling: [api2ai](https://github.com/annettodorothea/api2ai) (OpenAPI → MCP).

## Requirements

- VS Code or Cursor **1.67+**
- Node.js **20+** in demo/tool workspaces (for `@modelcontextprotocol/sdk`, `zod`, `pg`/`mysql2` at runtime)
- Docker Desktop for the Pagila PostgreSQL and Sakila MySQL demo DBs

## Usage

1. Open a workspace folder that contains `.db2ai` files.
2. Set `database env "YOUR_VAR"` or `database mysql env "YOUR_VAR"` and define `YOUR_VAR` in `.env`.
3. Edit `.db2ai` — on **save**, generated files appear under `generated/tools/` and `generated/cli/mcp-serve.mjs` (paths relative to the workspace).
4. Command Palette: **Generate tool code (.ts + .mjs + MCP host)** for manual generation of the focused `.db2ai` file.

Connection strings belong in `.env` / MCP host config, not in the DSL.

## MCP demos without cloning the repo

1. Install this extension (VSIX).
2. Command Palette → **db2ai: Create demo workspace (MCP examples)** → pick an empty folder.
3. In that folder: `npm install` → copy `.env.example` to `.env` → `npm run db:up` / `npm run db:sakila:up` → `npm run generate:pagila` / `npm run generate:sakila` (or save the `.db2ai` files / **Generate tool code**).
4. **File → Open Folder** on the demo workspace.
5. Cursor/VS Code: enable MCP server **`db2ai-pagila`** or **`db2ai-sakila`** in `.cursor/mcp.json` (Settings → Tools & MCP).

See the generated **`README.md`** in your demo folder for prompts and Docker scripts.

## License

BUSL-1.1 - Copyright (c) 2026 Annette Pohl. Full license text is included in the VSIX (`LICENSE` file, copied from the db2ai repository root when you run `npm run extension:vsix`).

---

_Created with gratitude to Jesus Christ._
