# Command-line interface (CLI)

Langium-backed **`parse`**, **`validate`**, and **`generate`** for `.db2ai` files, plus **`smoke-generated`** for testing MCP tool modules. The generator emits TypeScript, ESM `.mjs`, and copies the bundled MCP host from [`@core2ai/mcp-host`](../../../core2ai/packages/mcp-host) into `generated/cli/mcp-serve.mjs`.

## Commands

From the **db2ai workspace root** (after `npm install`, `npm run langium:generate`, `npm run build`):

```bash
node ./packages/cli/bin/cli.js parse <file.db2ai>
node ./packages/cli/bin/cli.js validate <file.db2ai>
node ./packages/cli/bin/cli.js generate <source.db2ai> <dest-tools.ts>
node ./packages/cli/bin/cli.js smoke-generated <path-to-*-tools.mjs> <toolName> [argsJson]
```

Prefer root `package.json` scripts: `generate:pagila`, `test:smoke:pagila`, `test:mcp:pagila`.

## Database env (DSL)

The `.db2ai` file declares the **environment variable name** for the PostgreSQL URL:

```text
database env "PAGILA_DATABASE_URL"
```

That name is emitted as `connectionEnv` in generated tools and used by the MCP host for startup validation and `hostContext.connectionString`. The actual URL lives in `.env` / `.env.local` (or Cursor `mcp.json` `env`), not in the DSL.

## MCP serve (JWT, optional)

Run the copied host (no need to repeat the DB env key in `args`):

```bash
node ./generated/cli/mcp-serve.mjs ./generated/tools/<name>-tools.mjs
```

Optional user login simulation (same pattern as api2ai):

```bash
node ./generated/cli/mcp-serve.mjs ./generated/tools/<name>-tools.mjs --auth-env DB2AI_USER_JWT
```

When `requiresAuth` is `true` in generated tools, `--auth-env` is required at startup. JWT payload is decoded into `hostContext.jwt` when the credential looks like a JWT.

Root `npm run bundle:mcp-runtime` bundles `core2ai/packages/mcp-host/src/mcp-standalone-entry.ts` → [`resources/mcp-serve-emitted.mjs`](./resources/mcp-serve-emitted.mjs).

## Layout

- [`bin/cli.js`](./bin/cli.js) — executable stub
- [`src/main.ts`](./src/main.ts) — Commander setup
- [`src/generator.ts`](./src/generator.ts) — code generation
- [`src/db-query-codegen.ts`](./src/db-query-codegen.ts) — SQL / table tool schemas
- [`src/json-schema-to-zod-codegen.ts`](./src/json-schema-to-zod-codegen.ts) — Zod schemas for MCP
- [`src/smoke.ts`](./src/smoke.ts) — smoke runner
- [`resources/mcp-serve-emitted.mjs`](./resources/mcp-serve-emitted.mjs) — bundled MCP host
