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

**`@core2ai/core`:** not on npm — link sibling core2ai once (see **[core2ai README](../core2ai/README.md#npm-link-api2ai--db2ai)**). While hacking core2ai, run **`npm run watch`** there so `out/` stays current.

Edit `.db2ai` under `packages/extension/demos/`, then:

| Workflow                    | How                                                                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Extension dev (usual)**   | **Run db2ai Extension** — save regenerates tools; run **`npm run build:generated`** in demos for MCP **`.js`**  |
| **All demos from terminal** | `npm run generate:all` in demos, then `npm run build:generated`                                                 |
| **One demo file**           | scripts in [`packages/extension/demos/`](./packages/extension/demos/) (`generate:pagila`, `generate:sakila`, …) |
| **CLI (debug / scripts)**   | `npx db-2-ai-dsl-cli parse\|validate\|generate …` — see [`packages/cli/README.md`](./packages/cli/README.md)    |

## Documentation

Shared architecture: **[core2ai docs hub](../core2ai/docs/README.md)** (sibling repo).

| Doc                                                                      | When to read                     |
| ------------------------------------------------------------------------ | -------------------------------- |
| [Layer 1 — Tool Factory](../core2ai/docs/01-layer-1-tool-factory.md)     | Langium, generators, extensions  |
| [Layer 2 — Tool Authoring](../core2ai/docs/02-layer-2-tool-authoring.md) | `.db2ai` and generated SQL tools |
| [Layer 3 — AI Runtime](../core2ai/docs/03-layer-3-ai-runtime.md)         | MCP, agents, execution           |
| [Personas](../core2ai/docs/04-personas.md)                               | Roles across the stack           |

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
| `release:vsix` | GitHub prerelease of tested VSIX (build with `extension:vsix` first)                                       |

All tests: `npm test` (from repo root). Docker must be running for Pagila/Sakila integration tests; containers are started automatically when needed.

Regenerate tools: `npm run generate:all` or per-demo scripts inside **`packages/extension/demos/`** (then **`npm run build:generated`** for MCP **`.js`**).

## Extension (VSIX)

Build locally:

```bash
npm run extension:vsix -w packages/extension
```

Prerelease (after local VSIX build + manual test):

```bash
npm run extension:vsix -w packages/extension   # build + install/test in Cursor
npm run release:vsix                           # upload that VSIX to GitHub
```

Bump extension version: `npm run version:patch` (or `minor` / `major`). Details: [`./packages/extension/README.md`](./packages/extension/README.md).

## Launch configurations

| Configuration                            | What it does                                       |
| ---------------------------------------- | -------------------------------------------------- |
| **Run db2ai Extension**                  | Extension Development Host with `demos/` workspace |
| **Attach: db2ai Language Server (6010)** | attach debugger (port 6010)                        |

Pre-launch task **Build db-2-ai-dsl**: `langium:generate` + `build` ([`./.vscode/tasks.json`](./.vscode/tasks.json) / workspace [`mcp-dsl.code-workspace`](../mcp-dsl.code-workspace)).

## License

BUSL-1.1 — see [`./LICENSE`](./LICENSE).

---

#Col3:23
