# Command-line interface (CLI)

Langium-backed **`parse`**, **`validate`**, and **`generate`** for `.db2ai` files, plus **`smoke-generated`** for testing MCP tool modules. The generator emits TypeScript, ESM `.mjs`, and copies the bundled MCP host into `examples/generated/cli/` when you generate from repo examples.

## Commands

From the **db2ai workspace root** (after `npm install`, `npm run langium:generate`, `npm run build`):

```bash
node ./packages/cli/bin/cli.js parse <file.db2ai>
node ./packages/cli/bin/cli.js validate <file.db2ai>
node ./packages/cli/bin/cli.js generate <source.db2ai> <dest-tools.ts>
node ./packages/cli/bin/cli.js smoke-generated <path-to-*-tools.mjs> <toolName> [argsJson]
```

Prefer root `package.json` scripts: `generate:pagila`, `test:smoke:pagila`, `test:mcp:pagila`.

## Layout

- [`bin/cli.js`](./bin/cli.js) — executable stub
- [`src/main.ts`](./src/main.ts) — Commander setup
- [`src/generator.ts`](./src/generator.ts) — code generation
- [`src/db-query-codegen.ts`](./src/db-query-codegen.ts) — SQL / table tool schemas
- [`src/smoke.ts`](./src/smoke.ts) — smoke runner
- [`mcp-bundle/`](./mcp-bundle/) — MCP server; root `npm run bundle:mcp-runtime` → [`resources/mcp-serve-emitted.mjs`](./resources/mcp-serve-emitted.mjs)
