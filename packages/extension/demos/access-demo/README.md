# access-demo — Docker Postgres + OAuth MCP

Database: `docker compose` service **access-demo** (see repo `docker-compose.yml`).

## Database

```bash
npm run db:access-demo:up
```

Connection: `ACCESS_DEMO_DATABASE_URL` in `.env.local` (see `.env.example`).

## OAuth MCP (`oauth-db2ai-access-demo`)

1. Database: `npm run db:access-demo:up`
2. IDP: `npm run demo:oauth-idp` (port **3862**, [`oauth-idp/`](./oauth-idp/))
3. Host: `npm run demo:mcp-oauth:access-demo` (port **3871**)
4. Cursor: enable **`oauth-db2ai-access-demo`**, reload MCP → OAuth on connect (`initialize` 401 when protected/checked tools exist)
5. Protected tool: `listProductsWithReviews`; public `listProducts` without Bearer

JWT secret: `ACCESS_DEMO_JWT_SECRET=db2ai-access-demo` (matches demo test tokens in `.env.example`).

---

#Col3:23
