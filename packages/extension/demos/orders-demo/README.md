# orders-demo — Docker Postgres + OAuth MCP

Database: Docker Compose service **orders-demo** (container `db2ai-orders-demo`, DB `orders_demo`).

```bash
npm run db:orders-demo:up
```

Connection: `ORDERS_DEMO_DATABASE_URL` in `.env` (see `.env.example`).

## OAuth MCP

1. `npm run init` (or DB + IdP + hosts manually)
2. Cursor: enable **`orders`**, reload MCP → OAuth sign-in

Ports (48xx): IdP RS256 **4863** · MCP oidc **4871**. Shared IdP: [`../oauth-idp/`](../oauth-idp/).

JWT (tests/dev): `ORDERS_DEMO_JWT_SECRET` · `node orders-demo/get-token.mjs alice`

---

#Col3:23
