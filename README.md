# db2ai

**db2ai** curates relational database queries into MCP tools: a **.db2ai DSL** defines SQL queries together with AI-facing metadata (intent, examples, tool names, optional column documentation). Queries are validated against a live PostgreSQL or MySQL database using EXPLAIN. A **code generator** (CLI + extension on save) emits tool modules and a stdio MCP host. Built with **[Langium](https://langium.org/)** (grammar, validation, and completion).

Sibling project: [api2ai](https://github.com/annettedorothea/api2ai) (OpenAPI to MCP). Shared library: [core2ai](https://github.com/annettedorothea/core2ai) (`@core2ai/core` via **npm link**).

Keywords: **DSL** · **SQL** · **PostgreSQL** · **MySQL** · **code generator** · **MCP** · **Langium**

## DSL at a glance

From [`./packages/extension/demos/pagila.db2ai`](./packages/extension/demos/pagila.db2ai):

```txt
database env "PAGILA_DATABASE_URL"

SQL {
    toolName: listFilms
    access: public
    intent: "list films from Pagila with pagination"
    query: "SELECT * FROM film LIMIT LEAST($1, 500) OFFSET $2"
    params: {
        $1: { name: limit, description: "max rows per page", example: "100", type: integer }
        $2: { name: offset, description: "rows to skip", example: "0", type: integer }
    }
}
```

Connection strings are **not** in the DSL — only the **env var name** (`database env "…"`). Values live in `.env` / MCP host config. More demos: [`./packages/extension/demos/`](./packages/extension/demos/).

## MCP demos

Bundled demos: **[`./packages/extension/demos/README.md`](./packages/extension/demos/README.md)**. Docker: `npm run db:up:all` in `packages/extension/demos`.

**Without cloning:** install the VSIX → **db2ai: Create demo workspace (MCP examples)**. See [`./packages/extension/README.md`](./packages/extension/README.md).

## Getting started

Prerequisite: **Node.js 20+**, sibling checkout **`../core2ai`**, **Docker** for database demos.

```bash
npm install
npm run install:demos
npm run langium:generate && npm run build && npm run check
```

**`@core2ai/core`:** not on npm — link sibling core2ai once (see **[core2ai README](https://github.com/annettedorothea/core2ai/blob/main/README.md#npm-link-api2ai--db2ai)**). While hacking core2ai, run **`npm run watch`** there so `out/` stays current.

Edit `.db2ai` under `packages/extension/demos/`, then:

| Workflow                    | How                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Extension dev (usual)**   | **Run db2ai Extension** — save regenerates tools; then **`npm run build:generated --prefix packages/extension/demos`** for MCP **`.js`** |
| **All demos from terminal** | **`npm run generate:all`**, then **`npm run build:generated --prefix packages/extension/demos`**                                         |
| **One demo file**           | scripts in [`packages/extension/demos/`](./packages/extension/demos/) (`generate:pagila`, `generate:sakila`, …)                          |
| **CLI (debug / scripts)**   | `npx db-2-ai-dsl-cli parse\|validate\|generate …` — see [`packages/cli/README.md`](./packages/cli/README.md)                             |

## Documentation

Shared architecture: **[core2ai docs hub](https://github.com/annettedorothea/core2ai/blob/main/docs/README.md)**.

| Doc                                                                                                                | When to read                     |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| [Layer 1 — Tool Factory](https://github.com/annettedorothea/core2ai/blob/main/docs/01-layer-1-tool-factory.md)     | Langium, generators, extensions  |
| [Layer 2 — Tool Authoring](https://github.com/annettedorothea/core2ai/blob/main/docs/02-layer-2-tool-authoring.md) | `.db2ai` and generated SQL tools |
| [Layer 3 — AI Runtime](https://github.com/annettedorothea/core2ai/blob/main/docs/03-layer-3-ai-runtime.md)         | MCP, agents, execution           |
| [Personas](https://github.com/annettedorothea/core2ai/blob/main/docs/04-personas.md)                               | Roles across the stack           |

## Project layout

| Path                        | Role                                               |
| --------------------------- | -------------------------------------------------- |
| `packages/language`         | Langium grammar, SQL/schema validation, completion |
| `packages/cli`              | `parse`, `validate`, `generate`, unit tests        |
| `packages/extension`        | VS Code / Cursor extension; **`demos/`**           |
| `packages/extension/demos/` | Sample DSL, Docker DBs, `generate:*`, MCP setup    |

Package notes: [`packages/language/README.md`](./packages/language/README.md) · [`packages/cli/README.md`](./packages/cli/README.md)

## Daily npm scripts (repository root)

| Script         | Purpose                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `build`        | TypeScript project references + workspace builds                                                           |
| `check`        | `format:check` + `typecheck` + `lint`                                                                      |
| `watch`        | TypeScript watch (monorepo)                                                                                |
| `test`         | `langium:generate`, `build`, all Vitest (language + CLI unit + demo integration; Docker for Pagila/Sakila) |
| `generate:all` | regenerate all demo tools (forwards to demos)                                                              |
| `vsix:prepare` | full verify pipeline before packaging (generate, demos JS, check, tests)                                   |
| `vsix:build`   | build VSIX (`packages/extension/vscode-*-X.Y.Z.vsix`; runs `langium:generate` + `build` again)             |
| `vsix:release` | GitHub prerelease of tested VSIX (after `vsix:build` + manual preview)                                     |

## Extension (VSIX)

Build locally:

```bash
npm run vsix:prepare  # optional but recommended before release
npm run vsix:build
```

Prerelease (after local VSIX build + manual test):

```bash
npm run vsix:prepare  # regenerate + check + tests
npm run vsix:build    # package VSIX; install/test in Cursor
npm run vsix:release  # upload that VSIX to GitHub
```

Version bump before VSIX: skill **guided release** (CP2) — agent sets the same `X.Y.Z` in root, `packages/cli`, `packages/language`, and `packages/extension`. Details: [`./packages/extension/README.md`](./packages/extension/README.md).

## Launch configurations

| Configuration                            | What it does                                       |
| ---------------------------------------- | -------------------------------------------------- |
| **Run db2ai Extension**                  | Extension Development Host with `demos/` workspace |
| **Attach: db2ai Language Server (6010)** | attach debugger (port 6010)                        |

Pre-launch task **Build db-2-ai-dsl**: `langium:generate` + `build` ([`./.vscode/tasks.json`](./.vscode/tasks.json) / multi-repo workspace `mcp-dsl.code-workspace`).

## License

BUSL-1.1 — see [`./LICENSE`](./LICENSE).

---

#Col3:23
