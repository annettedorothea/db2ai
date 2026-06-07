# db2ai MCP demos

[`.cursor/mcp.json`](./.cursor/mcp.json) · `.db2ai` workspace root

```bash
npm install && npm run start      # Pagila, Sakila, orders
npm run start:mssql               # SQL Server (optional, heavy)
npm run start:mssql:foreground    # … Ctrl+C stops MCP host
npm run start:oracle              # Oracle plants (optional, heavy)
npm run start:oracle:foreground   # … Ctrl+C stops MCP host
```

- Open this folder as Cursor workspace root
- Database URLs in `.env` (see `.env.example`)
- Cursor Settings → Tools & MCPs: enable needed servers
- Reload MCP after `.env`, `mcp.json`, or `.db2ai` changes

`npm run demo:kill-all` · Docker: `npm run db:kill:main` / `db:kill:mssql` / `db:kill:oracle`

| MCP server       | DSL               | Database                     | Transport | Port |
| ---------------- | ----------------- | ---------------------------- | --------- | ---- |
| `sakila`         | sakila            | MySQL (Sakila)               | stdio     | —    |
| `sakila-mariadb` | sakila-mariadb    | MariaDB (Sakila)             | stdio     | —    |
| `pagila`         | pagila            | PostgreSQL (Pagila)          | HTTP      | 4853 |
| `orders`         | orders-postgres   | PostgreSQL (orders_postgres) | OAuth     | 4871 |
| `animals`        | animals-sqlserver | SQL Server (animals)         | stdio     | —    |
| `plants`         | plants-oracle     | Oracle (plants)              | stdio     | —    |

---

#Col3:23
