# db2ai

Editor support for the **`.db2ai` DSL**: syntax highlighting, validation, schema-aware completion, and **generate on save** (TypeScript/ESM tool modules + MCP host).

The full project (DSL, CLI, demos) lives in the [db2ai](https://github.com/annettodorothea/db2ai) repository. Sibling: [api2ai](https://github.com/annettodorothea/api2ai) (OpenAPI to MCP).

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
2. Create a demo workspace:
    - Open the Command Palette.
    - Run **db2ai: Create demo workspace (MCP examples)**.
    - Pick an empty folder.
3. Prepare the demo folder:
    - Run `npm install`.
    - Copy `.env.example` to `.env`.
    - Start databases with `npm run db:up:all`.
    - Generate tools with `npm run generate:all`.
4. Open and enable:
    - Open the demo folder as the workspace.
    - In Cursor Settings, open **Tools & MCP**.
    - Enable **`db2ai-pagila`** or **`db2ai-sakila`**.

See the generated **`README.md`** in your demo folder for prompts and Docker scripts.

## Share a VSIX build

From the repository root:

```bash
npm run release:vsix
```

This runs tests, checks, packages the VSIX, creates a GitHub prerelease, and uploads the matching `.vsix` as a release asset. The release/tag name uses the extension `name` and `version` from [`package.json`](./package.json), for example `vscode-db2ai-0.0.1`. It requires the GitHub CLI (`gh`) to be installed and authenticated.

`db2ai` release verification runs MCP smoke tests against the Pagila and Sakila demo databases, so Docker Desktop must be running.

For a future version, bump the extension package first from the repository root:

```bash
npm run version:patch
```

Use `version:minor` or `version:major` when appropriate, then commit the version change before publishing.

## License

BUSL-1.1 - Copyright (c) 2026 Annette Pohl. Full license text is included in the VSIX (`LICENSE` file, copied from the db2ai repository root when you run `npm run extension:vsix`).

---

#Col3:23
