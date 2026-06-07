# db2ai MCP demos

[`mcp.json`](./.cursor/mcp.json) · `.db2ai` workspace root

```bash
npm install && npm run start      # Pagila, Sakila, orders
npm run start:mssql               # SQL Server (optional, heavy)
npm run start:mssql:foreground    # … Ctrl+C stops MCP + Docker
npm run start:oracle              # Oracle plants (optional, heavy)
npm run start:oracle:foreground # … Ctrl+C stops MCP + Docker
```

Cursor: enable MCP servers, reload after `.env` / `.db2ai` changes.

| MCP server       | DSL               | Transport | Port |
| ---------------- | ----------------- | --------- | ---- |
| `sakila`         | sakila            | stdio     | —    |
| `sakila-mariadb` | sakila-mariadb    | stdio     | —    |
| `pagila`         | pagila            | HTTP      | 4853 |
| `orders`         | orders-postgres   | OAuth     | 4871 |
| `animals`        | animals-sqlserver | stdio     | —    |
| `plants`         | plants-oracle     | stdio     | —    |

---

#Col3:23
