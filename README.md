# db2ai

**db2ai** selects relational database queries into MCP tools: a **`.db2ai` DSL** declares SQL tools plus AI-facing metadata (intent, examples, tool names, param specs). A **code generator** (CLI + extension on save) emits tool modules and a stdio MCP host. Built with **[Langium](https://langium.org/)** (grammar, validation, completion against PostgreSQL/MySQL schemas).

Sibling project: [api2ai](https://github.com/annettodorothea/api2ai) (OpenAPI to MCP).

Keywords: **DSL** · **SQL** · **PostgreSQL** · **MySQL** · **code generator** · **MCP** · **Langium**

## DSL at a glance

From [`./packages/extension/demos/pagila.db2ai`](./packages/extension/demos/pagila.db2ai):

```txt
database env "PAGILA_DATABASE_URL"

SQL {
    toolName: "listFilms"
    intent: "list films from Pagila with pagination"
    query: "SELECT * FROM film LIMIT LEAST($1, 500) OFFSET $2"
    params: {
        $1: { name: limit, description: "max rows per page", example: "100", type: integer }
        $2: { name: offset, description: "rows to skip", example: "0", type: integer }
    }
}
```

Connection strings are **not** in the DSL — only the **env var name** (`database env "…"`). Values live in `.env` / MCP host config.
Use `database mysql env "SAKILA_DATABASE_URL"` for MySQL; omitted dialect remains PostgreSQL for backwards compatibility.

## MCP demos

Bundled demos and walkthrough: **[`./packages/extension/demos/`](./packages/extension/demos/)** — see **[`./packages/extension/demos/README.md`](./packages/extension/demos/README.md)**. Start PostgreSQL: `cd packages/extension/demos && npm run db:up`; start MySQL: `npm run db:sakila:up`.

**Without cloning the repo:** install the VSIX, then run **db2ai: Create demo workspace (MCP examples)** from the Command Palette. Details: [`./packages/extension/README.md`](./packages/extension/README.md).

## Getting started (DSL / monorepo)

Prerequisite: **Node.js 20+**.

1. Prepare the repository:
    - Clone the repo.
    - From the repository root, install dependencies (GitHub pin on shared **core2ai**):
        ```bash
        npm run install:github-https
        npm run langium:generate
        npm run build
        ```
    - **`@core2ai/core` pin:** fixed Git tag in `packages/cli/package.json` (canonical pin in **core2ai** `scripts/core2ai-pin.json`; targets in `core2ai-pin.targets.json`). Show pin: `npm run core2ai:pin`. After a core2ai release: bump tag in core2ai, then `npm run core2ai:refresh-pin`.
2. Open the **`db2ai`** repository root in Cursor/VS Code.
3. Edit or create a `.db2ai` file, for example under `./packages/extension/demos/`.
4. Generate tools with one of these options:
    - **Extension dev:** Run **Run db2ai Extension** from Run and Debug. The Extension Development Host opens `packages/extension/demos/`; saving a `.db2ai` file regenerates tools.
    - **CLI only:** `node ./packages/cli/bin/cli.js generate <file.db2ai> <out-tools.ts>`.

MCP demos and chat tests: **[`./packages/extension/demos/README.md`](./packages/extension/demos/README.md)**.

## Project layout

| Path                 | Role                                                     |
| -------------------- | -------------------------------------------------------- |
| `packages/language`  | Langium grammar, SQL/schema validation, completion       |
| `packages/cli`       | `generate`, smoke tests, MCP bundle                      |
| `packages/extension` | VS Code / Cursor extension (VSIX); includes **`demos/`** |

Package notes: [`./packages/language/README.md`](./packages/language/README.md) · [`./packages/cli/README.md`](./packages/cli/README.md)

## npm scripts (repository root)

| Script               | Purpose                                                      |
| -------------------- | ------------------------------------------------------------ |
| `langium:generate`   | Regenerate Langium AST/grammar from `packages/language`      |
| `langium:watch`      | Watch grammar and regenerate on change                       |
| `build`              | TypeScript build (workspaces) + `bundle:mcp-runtime`         |
| `build:clean`        | `clean` then `build`                                         |
| `watch`              | TypeScript watch on the monorepo build graph                 |
| `clean`              | Clean all workspace build outputs                            |
| `bundle:mcp-runtime` | Bundle standalone `mcp-serve` into `packages/cli/resources/` |
| `generate:pagila`    | Regenerate Pagila PostgreSQL example tools                   |
| `generate:sakila`    | Regenerate Sakila MySQL example tools                        |
| `test`               | All automated tests, including Pagila/Sakila MCP stdio smoke |
| `test:smoke:pagila`  | Smoke-call `listFilms` on generated tools                    |
| `test:mcp:pagila`    | Smoke Pagila through generated MCP stdio host                |
| `test:mcp:sakila`    | Smoke Sakila through generated MCP stdio host                |

## Launch configurations ([`./.vscode/launch.json`](./.vscode/launch.json))

| Configuration                            | What it does                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Run db2ai Extension**                  | Extension Development Host with workspace `packages/extension/demos/`. Pre-launch task **Build db-2-ai-dsl**. |
| **Attach: db2ai Language Server (6010)** | Attach debugger to the language server (port **6010**; api2ai uses 6009).                                     |

Pre-launch task **Build db-2-ai-dsl** in [`./.vscode/tasks.json`](./.vscode/tasks.json) (`langium:generate` + `build`).

## Extension (VSIX)

Build (maintainers), from the repository root:

```bash
npm run extension:vsix
```

Output: `./packages/extension/vscode-db2ai-<version>.vsix` (**version** from [`./packages/extension/package.json`](./packages/extension/package.json); gitignored via `*.vsix`).

### Share a VSIX build

For a full prerelease from the repository root:

```bash
npm run release:vsix
```

This runs `npm run test`, `npm run check`, packages the VSIX, then creates a GitHub prerelease and uploads the matching VSIX asset. The release/tag name is derived from the extension package `name` and `version`, for example `vscode-db2ai-0.0.1`.

`db2ai` release verification runs MCP smoke tests against the Pagila and Sakila demo databases, so Docker Desktop must be running.

For a future version, bump the extension package first:

```bash
npm run version:patch
```

Use `version:minor` or `version:major` when appropriate. Commit the version change before publishing the release.

### Install in Cursor / VS Code (test)

1. Press `Cmd+Shift+P` and search for **`Install from VSIX`** or **`vsix`**
2. **`Extensions: Install from VSIX`**
3. Select `./packages/extension/vscode-db2ai-<version>.vsix`
4. **`Developer: Reload Window`**

Alternatively drag the `.vsix` into the Extensions panel, or:

```bash
cursor --install-extension "/absolute/path/to/db2ai/packages/extension/vscode-db2ai-0.0.1.vsix"
```

Extension details: [`./packages/extension/README.md`](./packages/extension/README.md) (includes icon in VSIX).

## License

BUSL-1.1 - see [`./LICENSE`](./LICENSE).

---

#Col3:23
