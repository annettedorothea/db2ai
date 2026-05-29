# db2ai MCP demos

Use the **db2ai** extension (VSIX or Extension Development Host). This folder is the recommended **Cursor/VS Code workspace**: `.db2ai` files, generated MCP tools, and [`.cursor/mcp.json`](./.cursor/mcp.json).

> **Links:** Paths are relative to **this demo workspace** unless noted. The db2ai project (DSL, build): [GitHub README](https://github.com/annettodorothea/db2ai/blob/main/README.md).

## Get demos without cloning the repo

1. Install the **db2ai** VSIX.
2. Create a demo workspace:
    - Open the Command Palette.
    - Run **db2ai: Create demo workspace (MCP examples)**.
    - Choose an empty folder.
3. Prepare the folder:
    - Run `npm install`.
    - Copy [`.env.example`](./.env.example) to `.env`.
4. Start databases and generate tools:
    - All demos: `npm run db:up:all`, then `npm run generate:all`.
    - PostgreSQL Pagila: `npm run db:pagila:up`, then `npm run generate:pagila`.
    - MySQL Sakila: `npm run db:sakila:up`, then `npm run generate:sakila`.
    - Access (JWT): `npm run db:access-demo:up`, then `npm run generate:access-demo` (see [Access demo in Docker](#access-demo-in-docker)).
5. Enable MCP:
    - Open the demo folder as the workspace.
    - Open Cursor Settings, then **Tools & MCP**.
    - Enable **`db2ai-pagila`**, **`db2ai-sakila`**, and/or **`db2ai-access-demo`**.

## What you can do here

- Edit **`.db2ai`** — on save, the extension generates `generated/tools/*` and `generated/cli/mcp-serve.mjs`
- Run **Pagila** (PostgreSQL) and **Sakila** (MySQL) DVD rental demos in Docker
- Run the **access-demo** PostgreSQL database to try **`public`**, **`protected`**, and **`checked`** tools with demo JWTs
- Chat in Cursor with prompts prefixed by **`db2ai`** (see [Demo prompts](#demo-prompts))

## Getting started

Prerequisites: **Node.js 20+**, **Docker Desktop** (running), **db2ai** extension active.

1. Open **this folder** as the workspace so `.cursor/mcp.json` applies.
2. Install dependencies:
    ```bash
    npm install
    ```
3. Copy [`.env.example`](./.env.example) to `.env`.
4. Start databases:
    - All demos: `npm run db:up:all` (first start can take about a minute).
    - PostgreSQL Pagila: `npm run db:pagila:up`.
    - MySQL Sakila: `npm run db:sakila:up`.
    - Access demo: `npm run db:access-demo:up` (PostgreSQL on port **55433** by default).
5. Generate tool code:
    - All demos: `npm run generate:all`.
    - Or per demo: `generate:pagila`, `generate:sakila`, `generate:access-demo`.
    - Alternative: save a `.db2ai` file or run **Generate tool code** from the Command Palette.
6. For **access-demo** — optional demo JWT in `.env` (see [`.env.example`](./.env.example)):
    - **`ACCESS_DEMO_TOKEN` unset or empty:** MCP starts; **`listProducts`** (`public`) works.
    - Set a token (alice/bob/admin) when testing **`listProductsWithReviews`** (`protected`) or **`listCustomerOrders`** (`checked`).
    - Switch token by commenting lines in `.env` — no MCP restart when only the token value changes.
7. Enable MCP in Cursor:
    - Open **Tools & MCP**.
    - Enable **`db2ai-pagila`**, **`db2ai-sakila`**, and/or **`db2ai-access-demo`**.
    - Reload MCP after changing database URLs in `.env`; connection strings are read when the MCP server starts.

### Common scripts

| Script                 | Action                                           |
| ---------------------- | ------------------------------------------------ |
| `db:up:all`            | Start Pagila, Sakila, and access-demo containers |
| `db:down`              | Stop all demo containers                         |
| `db:access-demo:up`    | Start access-demo PostgreSQL only                |
| `generate:all`         | Generate Pagila, Sakila, and access-demo tools   |
| `generate:access-demo` | Generate `generated/tools/access-demo-tools.*`   |

### Pagila in Docker

```bash
# Docker Desktop must be running
npm run db:pagila:up
```

| Script              | Action                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| `db:pagila:up`      | Start container (`docker compose up -d --wait` until healthcheck passes) |
| `db:pagila:reset`   | Remove container/volumes and start fresh                                 |
| `db:pagila:psql`    | Interactive `psql` inside the container                                  |
| `generate:pagila`   | Generate `generated/tools/pagila-tools.*` from DSL                       |
| `db:up`, `db:reset` | Backward-compatible Pagila aliases                                       |

Image: [synthesizedio/pagila:1.2](https://hub.docker.com/r/synthesizedio/pagila) (PostgreSQL with Pagila sample data). Upstream project: [devrimgunduz/pagila](https://github.com/devrimgunduz/pagila).

### Sakila in Docker

```bash
# MySQL Sakila demo on port 53306 by default
npm run db:sakila:up
npm run generate:sakila
```

| Script            | Action                                             |
| ----------------- | -------------------------------------------------- |
| `db:sakila:up`    | Start Sakila MySQL container until healthy         |
| `db:sakila:reset` | Remove the Sakila container and start fresh        |
| `db:sakila:mysql` | Interactive `mysql` shell inside the container     |
| `generate:sakila` | Generate `generated/tools/sakila-tools.*` from DSL |

Image: [sakiladb/mysql:8](https://hub.docker.com/r/sakiladb/mysql) (MySQL with Sakila sample data).

### Access demo in Docker

Small PostgreSQL database for **access** testing (`public` / `protected` / `checked` SQL tools and JWT stubs). Schema and seed data: [`./access-demo/init.sql`](./access-demo/init.sql). DSL: [`./access-demo.db2ai`](./access-demo.db2ai).

```bash
# Docker Desktop must be running
npm run db:access-demo:up
npm run generate:access-demo
```

| Script                 | Action                                                       |
| ---------------------- | ------------------------------------------------------------ |
| `db:access-demo:up`    | Start Postgres (`access_demo` DB) until healthcheck passes   |
| `db:access-demo:reset` | Remove container and recreate DB from `access-demo/init.sql` |
| `generate:access-demo` | Generate `generated/tools/access-demo-tools.*` from DSL      |

**Defaults**

| Setting      | Value                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| Host port    | `55433` (`ACCESS_DEMO_HOST_PORT` to override)                                                              |
| Database URL | `postgresql://postgres:postgres@localhost:55433/access_demo` → set as `ACCESS_DEMO_DATABASE_URL` in `.env` |
| MCP server   | all three pass `--auth-env` in [`.cursor/mcp.json`](./.cursor/mcp.json) (see below)                        |

**Demo JWT (HS256, no `exp`)** — committed in [`.env.example`](./.env.example) for copy into `.env`:

| Token line (uncomment one) | Claims                             | Use                                                                          |
| -------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| alice (active by default)  | `customerId: alice`, `role: user`  | `listCustomerOrders` as alice; `customerId` can be omitted (filled from JWT) |
| bob                        | `customerId: bob`, `role: user`    | User cannot read another customer’s orders                                   |
| admin                      | `customerId: admin`, `role: admin` | May pass any `customerId` in tool args                                       |

Switch identity by commenting/uncommenting `ACCESS_DEMO_TOKEN` in `.env` — **no MCP restart** required.

**Tools in this demo**

| Tool                      | Access      | Notes                                                                                                          |
| ------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `listProducts`            | `public`    | Product catalog; no credential                                                                                 |
| `listProductsWithReviews` | `protected` | Products that have reviews (join); requires `ACCESS_DEMO_TOKEN` / credential                                   |
| `listCustomerOrders`      | `checked`   | Stub [`./src/auth/listCustomerOrders.ts`](./src/auth/listCustomerOrders.ts) enforces JWT `customerId` / `role` |

**Pagila / Sakila** also declare `auth` and use `access: public` on most tools; `listActors` is `protected` (credential via `DB2AI_AUTH_TOKEN`) to exercise the DSL on another database.

Image: `postgres:16-alpine` with init script mounted from `./access-demo/init.sql`.

### Troubleshooting

- **Port 55432 in use:** `PAGILA_HOST_PORT=55433 npm run db:pagila:up` and set `PAGILA_DATABASE_URL` to `…@localhost:55433/pagila` in `.env`.
- **Port 53306 in use:** `SAKILA_HOST_PORT=53307 npm run db:sakila:up` and set `SAKILA_DATABASE_URL` to `…@localhost:53307/sakila` in `.env`.
- **Port 55433 in use:** `ACCESS_DEMO_HOST_PORT=55434 npm run db:access-demo:up` and set `ACCESS_DEMO_DATABASE_URL` to `…@localhost:55434/access_demo` in `.env`.
- **Schema changed (e.g. after pull):** `npm run db:access-demo:reset` — Postgres init scripts run only on first volume create.
- **Timeout on first start:** healthcheck allows ~60s start period; check `docker compose logs pagila`, `sakila`, or `access-demo`.
- **Changed database URL in `.env`:** reload the matching MCP server (`PAGILA_*`, `SAKILA_*`, `ACCESS_DEMO_DATABASE_URL`).
- **“Missing host credential” on a tool call:** set `ACCESS_DEMO_TOKEN` (access-demo) or `DB2AI_AUTH_TOKEN` (Pagila/Sakila) for **`protected`** / **`checked`** tools — not required for **`public`** tools or MCP startup.
- **MCP errors:** ensure the matching `db:*:up` / `generate:*` scripts succeeded and this folder is the workspace root.

## Pagila, Sakila, and access-demo

**Pagila** and **Sakila** use the same DVD rental sample domain, so film and actor prompts are intentionally comparable:

**access-demo** is a separate small Postgres DB for JWT-based `checked` access (orders per customer), not DVD data.

| Server              | Database                 | Use it for                                            |
| ------------------- | ------------------------ | ----------------------------------------------------- |
| `db2ai-pagila`      | PostgreSQL (Pagila)      | SQL examples, pagination, `protected` on `listActors` |
| `db2ai-sakila`      | MySQL (Sakila)           | Same rental domain as Pagila, MySQL dialect           |
| `db2ai-access-demo` | PostgreSQL (access_demo) | `public` / `checked` tools, demo JWTs, auth stubs     |

When several MCP servers are enabled, name **Pagila**, **Sakila**, or **access-demo** in the prompt to pick one. For Pagila vs Sakila, you can ask to compare both on the same question.

## Test in Cursor

1. Workspace = this folder; enable the MCP server(s) you need (`db2ai-pagila`, `db2ai-sakila`, `db2ai-access-demo`).
2. Prompts start with **`db2ai`** ([`./.cursor/rules/mcp-db2ai-only.mdc`](./.cursor/rules/mcp-db2ai-only.mdc)).

| Check              | Prompt                                                                           |
| ------------------ | -------------------------------------------------------------------------------- |
| Pagila rating      | `db2ai nutze Pagila: gib mir 20 R rated Filme`                                   |
| Sakila rating      | `db2ai nutze Sakila: gib mir 20 R rated Filme`                                   |
| Search in one DB   | `db2ai nutze Pagila: suche in den Filmen nach grace`                             |
| Actor films        | `db2ai nutze Sakila: in welchen Filmen spielt Penelope Guiness mit?`             |
| Compare both demos | `db2ai vergleiche Pagila und Sakila: suche Filme mit academy auf beiden Servern` |
| Access products    | `db2ai nutze access-demo: liste Produkte`                                        |
| Access + reviews   | `db2ai nutze access-demo: zeige Produkte mit Rezensionen` (protected)            |
| Access orders      | `db2ai nutze access-demo: zeige meine Bestellungen`                              |

After DSL changes: run the matching `generate:*` script, save the file, or **Generate tool code**, then reload MCP.

## MCP transport and credentials

These demos serve tools through a **local MCP server over stdio**. Cursor (or another MCP client) starts [`generated/cli/mcp-serve.mjs`](./generated/cli/mcp-serve.mjs), loads the matching `generated/tools/*-tools.mjs`, and talks MCP on the stdio transport configured in [`.cursor/mcp.json`](./.cursor/mcp.json).

There is **no sign-in step in MCP** itself.

- **Pagila / Sakila:** database URLs in [`.env`](./.env.example). **`DB2AI_AUTH_TOKEN`** optional at startup — only needed when calling **`protected`** tools (e.g. `listActors`).
- **access-demo:** `ACCESS_DEMO_DATABASE_URL` required; **`ACCESS_DEMO_TOKEN`** optional — required only for **`protected`** / **`checked`** tools, not for **`listProducts`** (`public`).

## MCP configuration

[`./.cursor/mcp.json`](./.cursor/mcp.json) registers all three servers. Connection URLs come from env, not from the DSL. **Argument order:** `mcp-serve.mjs`, then `*-tools.mjs`, then host flags.

| MCP server          | `--auth-env` variable |
| ------------------- | --------------------- |
| `db2ai-pagila`      | `DB2AI_AUTH_TOKEN`    |
| `db2ai-sakila`      | `DB2AI_AUTH_TOKEN`    |
| `db2ai-access-demo` | `ACCESS_DEMO_TOKEN`   |

## Example DSL

- [`./pagila.db2ai`](./pagila.db2ai) and [`./sakila.db2ai`](./sakila.db2ai) — `SQL { … }` tools with `access`, `params`, and `$n` placeholders.
- [`./access-demo.db2ai`](./access-demo.db2ai) — `auth`, `listProducts` (`public`), `listProductsWithReviews` (`protected`), `listCustomerOrders` (`checked`).

## MCP server

| Server              | Auth                         | Prerequisite                                             |
| ------------------- | ---------------------------- | -------------------------------------------------------- |
| `db2ai-pagila`      | DB URL + `DB2AI_AUTH_TOKEN`  | `db:pagila:up`, `generate:pagila`, `PAGILA_DATABASE_URL` |
| `db2ai-sakila`      | DB URL + `DB2AI_AUTH_TOKEN`  | `db:sakila:up`, `generate:sakila`, `SAKILA_DATABASE_URL` |
| `db2ai-access-demo` | DB URL + `ACCESS_DEMO_TOKEN` | `db:access-demo:up`, `generate:access-demo`, demo JWT    |

## Demo prompts

Prefix with **`db2ai`**.

- Pagila only: `db2ai nutze Pagila: gib mir 20 R rated Filme`
- Sakila only: `db2ai nutze Sakila: gib mir 20 R rated Filme`
- Same search, chosen server: `db2ai nutze Pagila: suche in den Filmen nach grace`
- Actor query: `db2ai nutze Sakila: in welchen Filmen spielt Penelope Guiness mit?`
- Compare both: `db2ai vergleiche Pagila und Sakila: suche Filme mit academy auf beiden Servern`
- Access demo: `db2ai nutze access-demo: liste die Produkte` / `… Produkte mit Rezensionen` / `… meine Bestellungen`

List tools use SQL params by name (`limit`, `offset`, …) as defined in each tool’s input schema.

## Verify from repository root

```bash
npm run db:access-demo:up --prefix ./packages/extension/demos
npm run generate:access-demo
npm run test:smoke:access-demo
npm run test:mcp:access-demo
```
