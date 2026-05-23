# db2ai

**db2ai** selects relational database queries into MCP tools: a **`.db2ai` DSL** declares tables or SQL plus AI-facing metadata (intent, examples, tool names, optional column docs). A **code generator** (CLI + extension on save) emits tool modules and a stdio MCP host. Built with **[Langium](https://langium.org/)** (grammar, validation, completion against PostgreSQL schema).

Sibling project: [api2ai](https://github.com/annettedorothea/api2ai) (OpenAPI → MCP).

Keywords: **DSL** · **SQL** · **PostgreSQL** · **code generator** · **MCP** · **Langium**

## DSL at a glance

From [`./examples/pagila.db2ai`](./examples/pagila.db2ai):

```txt
database env "PAGILA_DATABASE_URL"

SELECT * FROM film {
    toolName: "listFilms"
    intent: "list films from Pagila with pagination"
    example: "First page: limit 20 offset 0"
}
```

Connection strings are **not** in the DSL — only the **env var name** (`database env "…"`). Values live in `.env` / MCP host config.

## Examples

Demos, Pagila DB setup, MCP config: **[`./examples/`](./examples/)** — see **[`./examples/README.md`](./examples/README.md)**.

## Getting started (DSL / monorepo)

Prerequisite: **Node.js 20+**.

- Clone the repo
- Repository root: `npm install` → `npm run langium:generate` → `npm run build`
- Open the **`db2ai`** repository root in Cursor/VS Code
- Edit or create a `.db2ai` file (e.g. under `./examples/`)
- **Extension dev:** Run and Debug → **Run db2ai Extension** (opens `examples/` in an Extension Development Host; save regenerates tools)
- **CLI only:** `node ./packages/cli/bin/cli.js generate <file.db2ai> <out-tools.ts>`

MCP demos and chat tests: **[`./examples/README.md`](./examples/README.md)**.

## Project layout

| Path | Role |
|------|------|
| `packages/language` | Langium grammar, SQL/schema validation, completion |
| `packages/cli` | `generate`, smoke tests, MCP bundle |
| `packages/extension` | VS Code / Cursor extension (VSIX) |
| `examples/` | Sample `.db2ai`, generated tools, `.cursor/mcp.json` |

Package notes: [`./packages/language/README.md`](./packages/language/README.md) · [`./packages/cli/README.md`](./packages/cli/README.md)

## npm scripts (repository root)

| Script | Purpose |
|--------|---------|
| `langium:generate` | Regenerate Langium AST/grammar from `packages/language` |
| `langium:watch` | Watch grammar and regenerate on change |
| `build` | TypeScript build (workspaces) + `bundle:mcp-runtime` |
| `build:clean` | `clean` then `build` |
| `watch` | TypeScript watch on the monorepo build graph |
| `clean` | Clean all workspace build outputs |
| `bundle:mcp-runtime` | Bundle standalone `mcp-serve` into `packages/cli/resources/` |
| `generate:pagila` | Regenerate Pagila example tools |
| `test` | Language package unit tests |
| `test:smoke:pagila` | Smoke-call `listFilms` on generated tools |
| `test:mcp:pagila` | Start MCP server manually (Pagila tools) |

## Launch configurations ([`./.vscode/launch.json`](./.vscode/launch.json))

| Configuration | What it does |
|---------------|----------------|
| **Run db2ai Extension** | Extension Development Host with workspace `examples/`. Pre-launch task **Build db-2-ai-dsl**. |
| **Attach: db2ai Language Server (6010)** | Attach debugger to the language server (port **6010**; api2ai uses 6009). |

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

MIT — see [`./LICENSE`](./LICENSE).
