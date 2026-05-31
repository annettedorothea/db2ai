# db2ai

Editor support for the **`.db2ai` DSL**: syntax highlighting, validation, schema-aware completion, and **generate on save** (TypeScript/ESM tool modules + MCP host).

The full project (DSL, CLI, demos) lives in the [db2ai](https://github.com/annettodorothea/db2ai) repository. Sibling: [api2ai](https://github.com/annettodorothea/api2ai) (OpenAPI to MCP).

## Requirements

- VS Code or Cursor **1.67+**
- Node.js **20+** in demo/tool workspaces (for `@modelcontextprotocol/sdk`, `zod`, `pg`/`mysql2` at runtime)
- Docker Desktop for demo DBs (Pagila PostgreSQL, Sakila MySQL, access-demo PostgreSQL for JWT/access testing)

## Usage

1. Open a workspace folder that contains `.db2ai` files.
2. Set `database env "YOUR_VAR"` or `database mysql env "YOUR_VAR"` and define `YOUR_VAR` in `.env`.
3. Edit `.db2ai` — on **save**, the extension writes **`generated/tools/*.ts`**, **`generated/cli/mcp-serve.ts`**, and compiles **`.js`** for MCP. Run **`npm install`** once in the demo workspace so TypeScript is available.
4. Command Palette: **Generate tool code (.ts + MCP host)** for manual generation of the focused `.db2ai` file.

Connection strings belong in `.env` / MCP host config, not in the DSL.

## MCP demos without cloning the repo

1. Install this extension (VSIX).
2. Create a demo workspace:
    - Open the Command Palette.
    - Run **db2ai: Create demo workspace (MCP examples)**.
    - Pick an empty folder.
3. Prepare the demo folder:
    - Run `npm install`.
    - Copy `.env.example` to `.env`.
    - Start databases with `npm run db:up:all`.
    - Generate and compile: `npm run generate:all`, then `npm run build:generated`.
4. Open and enable:
    - Open the demo folder as the workspace.
    - In Cursor Settings, open **Tools & MCP**.
    - Enable **`db2ai-pagila`**, **`db2ai-sakila`**, and/or **`db2ai-access-demo`** (`DB2AI_AUTH_TOKEN` and `ACCESS_DEMO_TOKEN` in `.env` — see demos `.env.example`).

See the generated **`README.md`** in your demo folder for prompts and Docker scripts.

## License

BUSL-1.1 - Copyright (c) 2026 Annette Pohl. Full license text is included in the VSIX (`LICENSE` file, copied from the db2ai repository root when you run `npm run vsix:build` from the monorepo root).

---

#Col3:23
