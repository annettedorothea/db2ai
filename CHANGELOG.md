# Changelog

All notable changes to **db2ai** (DSL, generator, VSIX, demos) are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com). VSIX version follows [Semantic Versioning](https://semver.org).

Policy: [core2ai docs/development/changelog-policy.md](https://github.com/annettedorothea/core2ai/blob/main/docs/development/changelog-policy.md)

---

## [Unreleased]

---

## [1.0.0-rc.1] - 2026-07-06

MCP Option B hosts, shippable `build:mcp` bundles, and resilient demo start. Pins `@toolfactory.dev/core` **1.0.0-rc.2** from npmjs.

### Added

- **MCP host layout (Option B):** shared `generated/db2ai/cli/*-runtime.ts` plus per-module `generated/db2ai/servers/<module>-<host>-mcp-server.ts` (stdio, public HTTP, passthrough HTTP, OAuth HTTP)
- **`npm run build:mcp -- --host <kind> <module>`** — standalone bundle under `dist/mcp/<module>-<host>/` (`server.mjs`, `package.json`, `.env.example`, `mcp.json.example`, `npm start` with demo CLI flags)
- **Startup UX:** catalog-style MCP banners per host; orchestrator summary when starting demos
- **`npm run start:background`** — same stack without blocking the terminal (for `/test-all` and automation); foreground `npm run start` / `start:all` remains the default for local work
- **Demos README:** bundling walkthrough (`animals-sqlserver` / public HTTP)

### Changed

- Demo launchers and `.cursor/mcp.json` use `servers/*` entrypoints (regenerate after upgrade)
- **`npm run start`:** missing optional user secrets warn instead of exiting; each MCP host starts in its own try/catch so one failure does not stop the rest
- **`/test-all` skill:** documents `start:background` for automated runs

### Removed

- Legacy generic `generated/db2ai/cli/*-mcp-server.ts` hosts — run `npm run generate:all` and `npm run build:generated` after upgrading

### Upgrade notes

- Regenerate and rebuild demos: `npm run generate:all`, `npm run build:generated --prefix packages/extension/demos`
- Update `.cursor/mcp.json` / custom launchers to `servers/<module>-<host>-mcp-server.js` if you forked the old `cli/*-mcp-server` paths
- Database demos still require Docker (or equivalent) before `/test-all`

---

## [1.0.0-rc] - 2026-07-03

First release-candidate: **curated MCP tools from SQL** — define queries in `.db2ai`, enrich with intent and access rules, generate executable MCP servers.

### Added

- **Langium `.db2ai` DSL** with VSIX extension (syntax, validation, completions, generate-on-save)
- **`SQL { }` tool blocks:** `toolName`, `access`, `intent`, `query`, optional `params`, optional `hooks: { checkToolAccess, prepareToolCall }` with `clientMayOmit`
- **`database` declarations** binding connection strings from environment variables (`postgres`, `mysql`, `mariadb`, `sqlserver`, `oracle`)
- **SQL validation** via `EXPLAIN` dry-run against the configured database (no data changes during validation)
- **Code generator:** per-DSL tool module, Zod input schemas, `invokeTool`, hook stubs under `src/hooks/db2ai/`
- **Four MCP hosts per project** (same model as api2ai): stdio, public HTTP, passthrough HTTP, OAuth HTTP
- **Auth keyword** (`auth` or `auth { hooks: { verifyCredential: true } }`) enables credential pipeline; DB credentials stay in env — hooks implement authorization logic
- **Access control:** `access: public | protected` plus `verifyCredential`, `checkToolAccess`, `prepareToolCall` hooks (shared core2ai pipeline)
- **Flat MCP tool arguments** for SQL bind parameters (`:name` placeholders)
- **Demo workspaces:** Pagila (PostgreSQL), Sakila, orders and related examples across supported dialects
- **Manual E2E gate:** `/test-all` skill (`db2ai-test-all-mcp`)
- **Validator warning** when `auth` is set but every SQL block uses `access: public`
- **Validator warning** when `database … env "VAR"` is not set or empty in the editor environment
- **Validator error** when `query` contains `:name` placeholders without a `params: { … }` block
- **LSP completion:** `access: ` suggests `public` and `protected`

### Changed

- Pre-0.5 iterative features (HTTP MCP demos, flat args, hook pipeline) are folded into this baseline; changelog maintenance starts here
- **Hooks DSL:** `hooks: { checkToolAccess, prepareToolCall }` replaces top-level `authorize` / `prepare` on SQL blocks
- **verifyCredential stubs:** renamed to `verify*Credential.ts`; raw `credential: string`, void return (no `ModuleCredentials`)
- **`clientMayOmit`:** optional bind params on `prepareToolCall` (must reference `params` keys)
- **`/test-all`:** result report only, no full Audit section

### Known limitations (documented, not bugs)

- No DSL flag for read-only vs. DML — authors choose SELECT-only or write SQL deliberately and secure writes with `access: protected` and hooks
- Live `EXPLAIN` in CI is mocked; real DB connectivity is validated in the author’s workspace and via `/test-all`
- Generated hosts are MCP **tool servers** only — no resources, prompts, or sampling
- No automated MCP/invoke smoke in CI — use `/test-all` before release

### Upgrade notes

- Install VSIX from GitHub release; open or create a project workspace
- Migrate every `.db2ai` block to `hooks` syntax; run `npm run generate:all` and `npm run build:generated --prefix packages/extension/demos`
- Update hand-written hooks under `src/hooks/db2ai/**` to `checkToolAccessFor*` / `prepareToolCallFor*` export names
- Set database URLs in `.env` (same line as key); re-open DSL files if env warnings persist
- Sync `@toolfactory.dev/core` pin when upgrading sibling core2ai
- Before tagging final **1.0.0:** run `npm run check` and full `/test-all` with demos running

---

> _Whatever you do, work heartily, as for the Lord and not for men._
>
> **— Colossians 3:23**
>
> _Created by Annette Pohl_
