---
name: db2ai access concept
overview: 'Drei Commits: (0) db2ai TableQuery entfernen, (1) core2ai-Extraktion via api2ai-Refactor, (2) db2ai Access-Feature auf SQL-Tools. Token-Env nur in mcp.json (--auth-env).'
todos:
    - id: remove-table-query
      content: 'Commit 1 — db2ai: TableQuery entfernen, pagila/sakila auf SQL migrieren; Version 0.0.2'
      status: pending
    - id: core2ai-extract-api2ai
      content: 'Commit 2 — core2ai v0.0.2 + api2ai 0.0.2; file:-Pin entfernen, nur github#v0.0.2; JWT/Stub-Extraktion; build + check'
      status: pending
    - id: access-demo-docker
      content: 'Commit 3 — db2ai: access-demo DB + feste JWTs in .env.example'
      status: pending
    - id: dsl-access-grammar
      content: 'Commit 3 — db2ai: DSL auth { } + access auf SqlQuery, query-access.ts, Validator + Completion + Tests'
      status: pending
    - id: codegen-access
      content: 'Commit 3 — db2ai: Codegen mit core2ai-Hilfen (requiresAuth, stubs, invoke-Guard)'
      status: pending
    - id: access-demo-dsl
      content: 'Commit 3 — access-demo (public listProducts + checked listCustomerOrders); pagila/sakila access public + 1–2 protected; Stub + mcp.json + smoke'
      status: pending
isProject: false
---

# db2ai: TableQuery entfernen + core2ai-Extraktion + Access

## Gesamtstruktur (drei Commits)

| Schritt | Repo(s)          | Inhalt                                          | Commit   |
| ------- | ---------------- | ----------------------------------------------- | -------- |
| **0**   | db2ai            | TableQuery entfernen, Demos migrieren           | Commit 1 |
| **1**   | core2ai + api2ai | JWT/Stub-Hilfen nach core2ai, api2ai refactoren | Commit 2 |
| **2–4** | db2ai            | Access-Feature (nutzt core2ai aus Schritt 1)    | Commit 3 |

PoC → Alpha: **keine Deprecation**.

```mermaid
flowchart LR
  s0["Schritt 0\ndb2ai TableQuery raus"]
  s1["Schritt 1\ncore2ai + api2ai"]
  s2["Schritt 2–4\ndb2ai Access"]
  s0 -->|"Commit 1"| s1
  s1 -->|"Commit 2"| s2
  s2 -->|"Commit 3"| done["Alpha"]
```

**Warum api2ai vor db2ai Access?** Die Extraktion wird an einem funktionierenden Referenz-System (mock-api, checked stubs) validiert. db2ai übernimmt danach erprobte core2ai-APIs statt parallel zu duplizieren.

---

## Schritt 0: TableQuery entfernen (Commit 1 — nur db2ai)

Unverändert zum vorherigen Plan — nur db2ai, kein core2ai/api2ai.

### Grammar [`db-2-ai-dsl.langium`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/language/src/db-2-ai-dsl.langium)

- `TableQuery`, `TableName`, `ColumnDescriptions` entfernen
- `ModelEntry` = nur `SqlQuery`

### Language + CLI

| Datei                                                                                                                                               | Änderung                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [`db-2-ai-dsl-validator.ts`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/language/src/db-2-ai-dsl-validator.ts)                     | TableQuery-Validierung entfernen      |
| [`db-2-ai-dsl-completion-provider.ts`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/language/src/db-2-ai-dsl-completion-provider.ts) | `SELECT * FROM`-Completions entfernen |
| [`db-query-codegen.ts`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/cli/src/db-query-codegen.ts)                                    | Table-Pfad entfernen                  |
| [`invoke-render.ts`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/cli/src/generator/invoke-render.ts)                                | `renderTableInvokeCase` entfernen     |

### Demo-Migration

[`pagila.db2ai`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/extension/demos/pagila.db2ai), [`sakila.db2ai`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/extension/demos/sakila.db2ai) → SQL mit `LIMIT $1 OFFSET $2`.

Verifikation: `npm run langium:generate && npm run build && npm run check`, regenerate demos, Smoke-Tests.

---

## Schritt 1: core2ai-Extraktion via api2ai (Commit 2)

### 1a. core2ai — neue Exports

**[`core2ai/packages/mcp-host/src/jwt.ts`](file:///Users/annette/Documents/Projekte/MCP/core2ai/packages/mcp-host/src/jwt.ts)** (neu):

- `decodeJwtPayloadUnsafe(token: string): Record<string, unknown>`
- `resolveCredentialFromEnv(authEnvKey: string | undefined): string | undefined`
- `resolveCredentialAndOptionalJwt(authEnvKey): { credential?: string; jwt?: Record<string, unknown> }`

Export über [`mcp-host/src/index.ts`](file:///Users/annette/Documents/Projekte/MCP/core2ai/packages/mcp-host/src/index.ts).

**[`core2ai/packages/codegen/src/access-stubs.ts`](file:///Users/annette/Documents/Projekte/MCP/core2ai/packages/codegen/src/access-stubs.ts)** (neu):

- `AccessKind` — `'public' | 'protected' | 'checked'`
- `parameterCheckExportName(toolName: string)`
- `compileAuthStubSources(...)` — aus api2ai [`auth-stub-compile.ts`](file:///Users/annette/Documents/Projekte/MCP/api2ai/packages/cli/src/generator/auth-stub-compile.ts)

**Nicht nach core2ai:** `operation-access.ts` (api2ai-AST), HTTP-`auth.in/name/prefix`, OpenAPI-optionalParams, api2ai-spezifische `InvokeOptions`-Typen (pathParams/query/headers).

core2ai: `npm run build && npm run check`, neuer Git-Tag.

### 1b. api2ai — Generator refactoren

| Datei                                                                                                                             | Änderung                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [`host-adapter-render.ts`](file:///Users/annette/Documents/Projekte/MCP/api2ai/packages/cli/src/generator/host-adapter-render.ts) | Generierter Code importiert `@core2ai/core/mcp-host` JWT-Hilfen statt inline `decodeJwtPayloadUnsafe` |
| [`auth-stub-render.ts`](file:///Users/annette/Documents/Projekte/MCP/api2ai/packages/cli/src/generator/auth-stub-render.ts)       | `parameterCheckExportName`, `compileAuthStubSources` aus `@core2ai/core/codegen`                      |
| [`auth-stub-compile.ts`](file:///Users/annette/Documents/Projekte/MCP/api2ai/packages/cli/src/generator/auth-stub-compile.ts)     | Entfernen oder dünner Re-Export                                                                       |

**Verhalten unverändert** — mock-api-Demo, smoke-Tests, generierte Tools müssen identisch funktionieren.

### 1c. api2ai Lockfile + Verifikation

- `@core2ai/core` **immer** als GitHub-Pin `#v0.0.2` — **`file:../../../core2ai` entfernen** (kein lokaler Pfad mehr)
- `npm run install:github-https && npm run langium:generate && npm run build && npm run check`
- mock-api smoke / checked-access Tests grün

**db2ai in Schritt 1 nicht anfassen** — nur core-Tag notieren für Commit 3.

### Versionierung (0.0.2 überall)

| Repo / Artefakt | Commit         | Version                                                  |
| --------------- | -------------- | -------------------------------------------------------- |
| db2ai           | 1 (TableQuery) | `0.0.2` in Root + Packages                               |
| core2ai         | 2              | `package.json` **0.0.2**, Git-Tag **`v0.0.2`**           |
| api2ai          | 2              | `0.0.2`, Pin `@core2ai/core` → `github:…/core2ai#v0.0.2` |
| db2ai           | 3 (Access)     | bleibt `0.0.2`, Pin `#v0.0.2` (ersetzt `#v0.1.0`)        |

**Dependency-Regel:** api2ai und db2ai pinnen `@core2ai/core` **ausschließlich** per GitHub-Tag — kein `file:`-Workflow.

**Warum nicht 0.2.0?** Das wäre ein klassischer Semver-_Minor_-Sprung (0.1 → 0.2). In eurer Alpha-Phase mit überall `0.0.1` ist **`0.0.2` der logische Patch-Schritt** — einheitlich, ohne große Versions-Sprünge. Funktional reicht das völlig.

**Hinweis:** db2ai pinnt heute `#v0.1.0`. Der neue Tag `v0.0.2` ersetzt das bewusst — alles auf einer Linie `0.0.x`.

---

## Schritt 2: Demo-DB + feste Demo-Tokens (Commit 3 — db2ai)

Postgres `access-demo` in [`docker-compose.yml`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/extension/demos/docker-compose.yml), `demos/access-demo/init.sql`.

Feste Demo-JWTs (HS256, ohne `exp`) in committed [`.env.example`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/extension/demos/.env.example):

```env
ACCESS_DEMO_DATABASE_URL=postgresql://postgres:postgres@localhost:55433/access_demo
ACCESS_DEMO_TOKEN=eyJ...   # alice — aktiv
# ACCESS_DEMO_TOKEN=eyJ... # bob / admin
```

Token-Wechsel per Kommentar in `.env` — kein MCP-Neustart.

### Access pro Demo (Commit 3)

**Alle** `.db2ai`-Dateien bekommen Pflichtfeld `access` (+ `auth { }` nur wo nötig).

| Demo            | Rolle                       | Access-Mix                                                                                                       |
| --------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **pagila**      | `public` + Syntax-Beispiele | fast alles `public`; **1–2 Tools künstlich `protected`** (Credential-Guard testen, kein fachliches RLS-Szenario) |
| **sakila**      | wie pagila                  | fast alles `public`; **1–2 Tools künstlich `protected`**                                                         |
| **access-demo** | echtes Access-Szenario      | `listProducts` **`public`**; `listCustomerOrders` **`checked`** (+ Stub); Modell mit `auth { }`                  |

**`protected` bei SQL:** Fachlich schwach (kein HTTP-Gateway, kein sinnvolles „nur mit Token“ ohne Stub-Logik). Reicht als **Sprach-/Codegen-Test** (Credential required, kein `check*Parameters`). Ein dediziertes `listAllOrders`-protected-Tool in access-demo **entfällt** — Pagila/Sakila decken `protected` als Syntax ab. Später erst relevant, wenn ein echter MCP/HTTP-Server davor sitzt.

Pagila-Listen-Queries: `LEAST($1, 500)` für früheres `maxLimit`-Verhalten.

---

## Schritt 3: DSL + Language — Access (Commit 3 — db2ai)

```langium
entry Model:
    'database' (dialect=DatabaseDialect)? 'env' env=STRING
    ('auth' auth=Auth)?
    (entries += SqlQuery)*;

Auth: '{' '}';

SqlQuery:
    'SQL' '{'
        ('toolName' ':' toolName=STRING)?
        'access' ':' access=Access
        ...
    '}';
```

- [`query-access.ts`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/language/src/query-access.ts) — analog api2ai `operation-access.ts`, nur für `SqlQuery`
- Validator: `protected`/`checked` brauchen `auth { }`; `optionalParams` gegen `params.*.name`
- Completion + Tests

---

## Schritt 4: Codegen — Access (Commit 3 — db2ai)

Nutzt core2ai aus Schritt 1 (neuer Tag in db2ai lockfile):

| Änderung                    | Quelle / Verhalten                                                      |
| --------------------------- | ----------------------------------------------------------------------- |
| JWT im Host-Adapter         | `@core2ai/core/mcp-host`                                                |
| Stub-Compile                | `@core2ai/core/codegen` `compileAuthStubSources`                        |
| `requiresAuth` / `authKind` | aus `model.auth` + `access`                                             |
| `optionalParams`            | Input-Schema relaxieren                                                 |
| Invoke                      | Credential-Guard + `check*Parameters` vor SQL                           |
| Auth-Stubs                  | `db2ai-invoke-options.ts` mit `InvokeOptions = Record<string, unknown>` |

db2ai-spezifisch (nicht aus api2ai kopiert): SQL-Invoke-Pfad statt HTTP.

---

## Schritt 5: Access-Demo + Verifikation (Commit 3 — db2ai)

- [`access-demo.db2ai`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/extension/demos/access-demo.db2ai): `auth { }`, `listProducts` (public), `listCustomerOrders` (checked)
- [`pagila.db2ai`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/extension/demos/pagila.db2ai) / [`sakila.db2ai`](file:///Users/annette/Documents/Projekte/MCP/db2ai/packages/extension/demos/sakila.db2ai): überwiegend `access: public`, je 1–2 `protected` ohne fachliche Begründung
- Stub `listCustomerOrders.ts` (JWT `tenantId`, `customerId`, `role`)
- MCP `db2ai-access-demo` mit `--auth-env ACCESS_DEMO_TOKEN`
- npm-Script `generate:access-demo` (analog `generate:pagila`)

```bash
npm run install:github-https   # Pin #v0.0.2
npm run langium:generate && npm run build && npm run check
docker compose up access-demo
npm run generate:access-demo
npm run test:smoke:access-demo
```

---

## Abgrenzung

- db2ai host-adapter in Schritt 1 **nicht** refactoren (erst in Schritt 4 mit Access)
- Row-Level Security in Postgres (nur Stubs)
- JWT-Signatur-Verifikation zur Laufzeit
- TableQuery (entfernt in Schritt 0)

## Risiken

| Risiko                              | Mitigation                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| core2ai-Tag-Koordination            | Schritt 1 komplett in api2ai validieren, dann db2ai bumpen                      |
| Generierter Code importiert core2ai | MCP-Bundle muss `@core2ai/core/mcp-host` external/resolvable halten (wie heute) |
| api2ai-Regression                   | mock-api smoke vor db2ai-Access                                                 |
