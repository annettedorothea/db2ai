# Changelog

All notable changes to **db2ai** (DSL, generator, VSIX, demos) are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com). VSIX version follows [Semantic Versioning](https://semver.org).

Policy: [core2ai docs/development/changelog-policy.md](https://github.com/annettedorothea/core2ai/blob/main/docs/development/changelog-policy.md)

---

## [Unreleased]

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
