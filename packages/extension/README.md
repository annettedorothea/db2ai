# db2ai

Editor support for the **`.db2ai` DSL**: syntax highlighting, validation, schema-aware completion, and **generate on save** (TypeScript tool modules + MCP host).

The full project (DSL, CLI, demos) lives in the [db2ai](https://github.com/annettodorothea/db2ai) repository. Sibling: [api2ai](https://github.com/annettedorothea/api2ai) (OpenAPI to MCP).

## Requirements

- VS Code or Cursor **1.67+**
- Node.js **20+** in demo/tool workspaces (for `@modelcontextprotocol/sdk`, `zod`, `pg` / `mysql2` at runtime)
- **Docker Desktop** (running) for demo databases

## Usage

1. Open a workspace folder that contains `.db2ai` files.
2. Edit `.db2ai` — on **save**, the extension writes **`generated/tools/*.ts`**, **`generated/cli/stdio-mcp-server.ts`**, and compiles **`.js`** for MCP (same as **`npm run build:generated`**). Run **`npm install`** once in the workspace so TypeScript is available.
3. Command Palette: **Generate tool code (.ts + MCP host)** for manual generation of the focused `.db2ai` file.

Set `database env "YOUR_VAR"` (or `database mysql env "YOUR_VAR"`) in the DSL and define **`YOUR_VAR`** in `.env` / MCP config — not in the DSL file itself.

## MCP demo workspace

1. Install this extension (VSIX).
2. Command Palette → **db2ai: Create demo workspace (MCP examples)** → choose an empty folder.
3. In that folder run **`npm run start`** (requires Docker: creates `.env` from `.env.example` if missing, install, start all demo DBs including Oracle, generate all DSLs, compile). First **`plants-oracle`** pull may take several minutes; one-time `docker login container-registry.oracle.com`.
4. Edit **`.env`** for database URLs and optional static token (`DB2AI_AUTH_TOKEN` for `sakila`).
5. Open the demo folder as the workspace. In Cursor Settings → **Tools & MCP**, enable servers from `.cursor/mcp.json` (`sakila`, `pagila`, `orders`).

**Reload MCP** after changing `.db2ai`, running generate/build, or env vars that MCP reads at server startup (e.g. database URLs).

Details, scripts, and example prompts: **`README.md`** in the demo folder.

## License

BUSL-1.1 - Copyright (c) 2026 Annette Pohl. Full license text is included in the VSIX (`LICENSE` file, copied from the db2ai repository root when you run `npm run vsix:build` from the monorepo root).

---

#Col3:23
