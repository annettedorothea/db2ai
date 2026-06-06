# orders-database — Docker Postgres + OAuth MCP

Database: Docker Compose service **orders-database** (container `db2ai-orders-database`, DB `orders_database`).

```bash
npm run db:orders-database:up
```

Connection: `ORDERS_DATABASE_URL` in `.env` (see `.env.example`).

OAuth MCP host: `npm run demo:mcp-oauth:orders` (port 4871, oidc against IdP :4863).

```bash
npm run init
```

JWT (tests/dev): `ORDERS_DATABASE_JWT_SECRET` · `node orders-database/get-token.mjs alice`
