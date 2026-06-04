# orders-demo — Docker Postgres + OAuth MCP

Database: Docker Compose service **orders-demo** (container `db2ai-orders-demo`, DB `orders_demo`).

```bash
npm run db:orders-demo:up
```

Connection: `ORDERS_DEMO_DATABASE_URL` in `.env` (see `.env.example`).

## OAuth MCP (`orders-demo-oauth`)

1. Database: `npm run db:orders-demo:up`
2. IDP: `npm run demo:oauth-idp` (port **3862**)
3. Host: `npm run demo:mcp-oauth:orders-demo` (port **3871**)
4. Cursor: enable **`orders-demo-oauth`**, reload MCP → OAuth on connect

JWT secret: `ORDERS_DEMO_JWT_SECRET=db2ai-orders-demo` (matches demo tokens in `.env.example`).
