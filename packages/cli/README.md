# Command-line interface (CLI)

Langium-backed **`parse`**, **`validate`**, and **`generate`** for `.db2ai` files, plus **`smoke-generated`** for testing MCP tool modules.

## Commands

From the **db2ai workspace root** (after `npm install`, `npm run langium:generate`, `npm run build`):

```bash
node ./packages/cli/bin/cli.js parse <file.db2ai>
node ./packages/cli/bin/cli.js validate <file.db2ai>
node ./packages/cli/bin/cli.js generate <source.db2ai> <dest-tools.ts>
node ./packages/cli/bin/cli.js smoke-generated <path-to-*-tools.mjs> <toolName> [argsJson]
```

Prefer **`npm run generate:*`** or **`generate:all`** in **[`../extension/demos/`](../extension/demos/)** (not root `package.json`).

## Smoke tests

From repo root:

```bash
npm run test:smoke              # pagila + access-demo direct smokes
npm run test:smoke:pagila
npm run test:e2e                # Docker MCP e2e suite
npm run test:mcp:pagila         # one e2e scenario
```

Scenarios: [`../../scripts/dev-smoke.config.json`](../../scripts/dev-smoke.config.json).

`npm test` includes Pagila/Sakila integration tests and MCP stdio smokes (Docker). `npm run check` skips tests (fast pre-commit).

## Database env (DSL)

```text
database env "PAGILA_DATABASE_URL"
database mysql env "SAKILA_DATABASE_URL"
```

The env **name** is in the DSL; the URL lives in `.env` / `mcp.json` `env`.

## MCP serve

```bash
node ./generated/cli/mcp-serve.mjs ./generated/tools/<name>-tools.mjs
node ./generated/cli/mcp-serve.mjs ./generated/tools/<name>-tools.mjs --auth-env DB2AI_USER_JWT
```

Root `npm run bundle:mcp-runtime` bundles `@core2ai/core/mcp-host` into [`resources/mcp-serve-emitted.mjs`](./resources/mcp-serve-emitted.mjs).

---

#Col3:23
