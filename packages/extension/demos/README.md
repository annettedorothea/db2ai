# db2ai MCP demos

[`mcp.json`](./.cursor/mcp.json) · `.db2ai` workspace root

```bash
npm install && npm run start      # Pagila, Sakila, orders
npm run start:mssql               # SQL Server (optional, heavy)
```

Cursor: enable MCP servers, reload after `.env` / `.db2ai` changes.

| MCP       | DSL               | Transport | Port |
| --------- | ----------------- | --------- | ---- |
| `sakila`  | sakila            | stdio     | —    |
| `pagila`  | pagila            | HTTP      | 4853 |
| `orders`  | orders-postgres   | OAuth     | 4871 |
| `animals` | animals-sqlserver | stdio     | —    |

---

#Col3:23
