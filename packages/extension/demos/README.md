# db2ai MCP demos

> **Pre-release** — demo workspace for trying db2ai; not a stability guarantee for production.

[`.cursor/mcp.json`](./.cursor/mcp.json) · `.db2ai` workspace root

```bash
npm install && npm run start           # all DBs, generate, compile, MCP/IDP (background)
npm run start:foreground               # … Ctrl+C stops services started here
```

- Open this folder as Cursor workspace root
- Database URLs in `.env` (see `.env.example`)
- **`npm run start`** starts all demo databases including **plants-oracle** (slow on first pull; one-time `docker login container-registry.oracle.com`)
- Cursor Settings → Tools & MCPs: enable needed servers
- Reload MCP after `.env`, `mcp.json`, or `.db2ai` changes

`npm run demo:kill-all` stops MCP/IDP **and** all Docker demo DBs

Protected/checked tools: implement `src/auth/<module>/verifyCredential.ts` (write-once stub from generate).

| MCP server       | DSL               | Database                     | Transport          | Port |
| ---------------- | ----------------- | ---------------------------- | ------------------ | ---- |
| `sakila`         | sakila            | MySQL (Sakila)               | stdio              | —    |
| `sakila-mariadb` | sakila-mariadb    | MariaDB (Sakila)             | stdio              | —    |
| `pagila`         | pagila            | PostgreSQL (Pagila)          | HTTP (passthrough) | 4853 |
| `orders`         | orders-postgres   | PostgreSQL (orders_postgres) | HTTP (oauth)       | 4871 |
| `animals`        | animals-sqlserver | SQL Server (animals)         | stdio              | —    |
| `plants`         | plants-oracle     | Oracle (plants)              | stdio              | —    |

---

#Col3:23
