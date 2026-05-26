# db2ai

**db2ai** selects relational database queries into MCP tools: a **`.db2ai` DSL** declares tables or SQL plus AI-facing metadata (intent, examples, tool names, optional column docs). A **code generator** (CLI + extension on save) emits tool modules and a stdio MCP host. Built with **[Langium](https://langium.org/)** (grammar, validation, completion against PostgreSQL/MySQL schemas).

Sibling project: [api2ai](https://github.com/annettodorothea/api2ai) (OpenAPI → MCP).

Keywords: **DSL** · **SQL** · **PostgreSQL** · **MySQL** · **code generator** · **MCP** · **Langium**

## DSL at a glance

From [`./packages/extension/demos/pagila.db2ai`](./packages/extension/demos/pagila.db2ai):

```txt
database env "PAGILA_DATABASE_URL"

SELECT * FROM film {
    toolName: "listFilms"
    intent: "list films from Pagila with pagination"
    example: "First page: limit 20 offset 0"
}
```

Connection strings are **not** in the DSL — only the **env var name** (`database env "…"`). Values live in `.env` / MCP host config.
Use `database mysql env "SAKILA_DATABASE_URL"` for MySQL; omitted dialect remains PostgreSQL for backwards compatibility.

## MCP demos

Bundled demos and walkthrough: **[`./packages/extension/demos/`](./packages/extension/demos/)** — see **[`./packages/extension/demos/README.md`](./packages/extension/demos/README.md)**. Start PostgreSQL: `cd packages/extension/demos && npm run db:up`; start MySQL: `npm run db:sakila:up`.

**Without cloning the repo:** install the VSIX, then Command Palette → **db2ai: Create demo workspace (MCP examples)**. Details: [`./packages/extension/README.md`](./packages/extension/README.md).

## Getting started (DSL / monorepo)

Prerequisite: **Node.js 20+**.

- Clone the repo
- Repository root: `npm install` → `npm run langium:generate` → `npm run build`
- Open the **`db2ai`** repository root in Cursor/VS Code
- Edit or create a `.db2ai` file (e.g. under `./packages/extension/demos/`)
- **Extension dev:** Run and Debug → **Run db2ai Extension** (opens `packages/extension/demos/` in an Extension Development Host; save regenerates tools)
- **CLI only:** `node ./packages/cli/bin/cli.js generate <file.db2ai> <out-tools.ts>`

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

Build (maintainers), in **`packages/extension/`**:

```bash
npm run extension:vsix
```

→ `./packages/extension/vscode-db2ai-<version>.vsix` (**version** from [`./packages/extension/package.json`](./packages/extension/package.json); gitignored via `*.vsix`).

From repo root: `npm run extension:vsix -w packages/extension`

### Install in Cursor / VS Code (test)

1. `Cmd+Shift+P` → **`Install from VSIX`** or **`vsix`**
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

_Created with gratitude to Jesus Christ._
