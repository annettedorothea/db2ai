# db2ai

**db2ai** selects relational database queries into MCP tools: a **`.db2ai` DSL** declares SQL tools plus AI-facing metadata (intent, examples, tool names, param specs). A **code generator** (CLI + extension on save) emits tool modules and a stdio MCP host. Built with **[Langium](https://langium.org/)** (grammar, validation, completion against PostgreSQL/MySQL schemas).

Sibling project: [api2ai](https://github.com/annettedorothea/api2ai) (OpenAPI to MCP). Shared library: [core2ai](https://github.com/annettedorothea/core2ai) (`@core2ai/core`).

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

Connection strings are **not** in the DSL — only the **env var name** (`database env "…"`). Values live in `.env` / MCP host config.

## MCP demos

Bundled demos: **[`./packages/extension/demos/README.md`](./packages/extension/demos/README.md)**. Docker: `npm run db:up:all` in `packages/extension/demos`.

**Without cloning:** install the VSIX → **db2ai: Create demo workspace (MCP examples)**. See [`./packages/extension/README.md`](./packages/extension/README.md).

## Getting started

Prerequisite: **Node.js 20+**, **Docker** for database demos.

```bash
npm run install:github-https
npm run langium:generate && npm run build && npm run check
```

**`@core2ai/core` pin:** Git tag in `packages/cli/package.json` (canonical: **core2ai** `scripts/core2ai-pin.json`). Show pin: `npm run core2ai:pin`. After a core2ai release: `npm run core2ai:use-pin`. Local core2ai work: `npm run core2ai:use-local` (switch back with `use-pin` before push).

Edit `.db2ai` under `packages/extension/demos/`, then:

- **Extension dev:** **Run db2ai Extension** (opens demos workspace; save regenerates tools).
- **CLI:** `node ./packages/cli/bin/cli.js parse|validate|generate <file> …`

## Documentation

Shared architecture (three layers, core2ai pin, build cheatsheet): **[core2ai docs hub](../core2ai/docs/README.md)** (sibling repo).

| Doc                                                                                 | When to read                           |
| ----------------------------------------------------------------------------------- | -------------------------------------- |
| [Three layers overview](../core2ai/docs/01-three-layers-overview.md)                | First visit — how db2ai fits the stack |
| [Layer 2 — MCP server and tools](../core2ai/docs/03-layer2-mcp-server-and-tools.md) | SQL tools and `mcp-serve.mjs`          |
| [Layer 3 — Cursor and agent](../core2ai/docs/04-layer3-cursor-and-agent.md)         | Demos, `mcp.json`, chat testing        |
| [Build cheatsheet](../core2ai/docs/consumer-build-cheatsheet.md)                    | Which npm script to run                |

## Project layout

| Path                 | Role                                               |
| -------------------- | -------------------------------------------------- |
| `packages/language`  | Langium grammar, SQL/schema validation, completion |
| `packages/cli`       | `parse`, `validate`, `generate`, smoke tests       |
| `packages/extension` | VS Code / Cursor extension; **`demos/`**           |

Package notes: [`packages/language/README.md`](./packages/language/README.md) · [`packages/cli/README.md`](./packages/cli/README.md)

## Daily npm scripts (repository root)

| Script              | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `build`             | TypeScript + `bundle:mcp-runtime` + workspaces                       |
| `check`             | format + typecheck + lint + generated tools                          |
| `test`              | unit + MCP e2e (Docker)                                              |
| `test:smoke`        | all direct generated-tool smokes                                     |
| `test:e2e`          | Pagila + Sakila + access-demo MCP e2e                                |
| `generate:all`      | regenerate all demo tools (forwards to demos)                        |
| `core2ai:use-pin`   | apply GitHub pin after core2ai release                               |
| `core2ai:use-local` | link sibling `../core2ai` for dev                                    |
| `release:vsix`      | GitHub prerelease of tested VSIX (build with `extension:vsix` first) |

Per-demo: `npm run test:smoke:pagila`, `test:smoke:access-demo`, `test:mcp:pagila`, … — see [`scripts/dev-smoke.config.json`](./scripts/dev-smoke.config.json).

Regenerate tools: `npm run generate:all` or `npm run generate:pagila|sakila|access-demo` inside **`packages/extension/demos/`**.

## Extension (VSIX)

```bash
npm run extension:vsix -w packages/extension   # build + install/test in Cursor
npm run release:vsix                           # upload that VSIX to GitHub
```

Build and test the VSIX locally before `release:vsix` — the script does not rebuild or re-run tests.

Bump extension version: `npm run version:patch` (or `minor` / `major`). Details: [`./packages/extension/README.md`](./packages/extension/README.md).

## Launch configurations

| Configuration                            | What it does                                       |
| ---------------------------------------- | -------------------------------------------------- |
| **Run db2ai Extension**                  | Extension Development Host with `demos/` workspace |
| **Attach: db2ai Language Server (6010)** | attach debugger (port 6010)                        |

Pre-launch task **Build db-2-ai-dsl**: `langium:generate` + `build`.

## License

BUSL-1.1 — see [`./LICENSE`](./LICENSE).

---

#Col3:23
