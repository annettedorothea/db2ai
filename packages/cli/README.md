# Command-line interface (CLI)

Langium-backed **`parse`**, **`validate`**, and **`generate`** for `.db2ai` files.

For day-to-day work you usually **do not** call this CLI directly — see [How to run](#how-to-run) below.

## How to run

**Prerequisite** (workspace root): `npm run langium:generate && npm run build`

From the **db2ai repo root**, prefer the workspace bin:

```bash
npx db-2-ai-dsl-cli parse <file.db2ai>
npx db-2-ai-dsl-cli validate <file.db2ai>
npx db-2-ai-dsl-cli generate <source.db2ai> <dest-tools.ts>
```

Equivalent (same entrypoint): `node ./packages/cli/bin/cli.js …`

| Workflow                  | Instead of raw CLI                                                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Demos in the monorepo** | Extension Dev Host (save → regenerate) or `npm run generate:all` in [`../extension/demos/`](../extension/demos/)                                                                      |
| **One demo file**         | `node ../extension/demos/scripts/generate.mjs …` (from demos folder)                                                                                                                  |
| **Installed VSIX**        | Save in editor, or embedded `cli.cjs` via demo generate script                                                                                                                        |
| **Integration tests**     | `npm test` from repo root — demo Docker/MCP tests in [`../extension/demos/test/README.md`](../extension/demos/test/README.md); CLI unit tests in [`test/README.md`](./test/README.md) |

`validate` / `generate` block on DSL errors (shared gate from `@core2ai/core/codegen`).

## Database env (DSL)

```text
database env "PAGILA_DATABASE_URL"
database mysql env "SAKILA_DATABASE_URL"
```

The env **name** is in the DSL; the URL lives in `.env` / `mcp.json` `env`.

## MCP serve

Generate and compile demos first (`npm run generate:all`, `npm run build:generated` in [`../extension/demos/`](../extension/demos/)), then:

```bash
node ./generated/cli/mcp-serve.js ./generated/tools/<name>-tools.js
node ./generated/cli/mcp-serve.js ./generated/tools/<name>-tools.js --auth-env DB2AI_AUTH_TOKEN
```

The MCP host is **generated** (`cli/mcp-serve.ts`) — no `@core2ai/core` at runtime.

## Layout

- [`src/main.ts`](./src/main.ts) — Commander: `parse`, `validate`, `generate`
- [`src/generator/`](./src/generator/) — code generation
- [`test/`](./test/) — Vitest (direct invoke + MCP stdio; Docker for Pagila/Sakila)

---

#Col3:23
