# OAuth IdP (db2ai demos)

| Port | env var                            | Signing | MCP server                  |
| ---- | ---------------------------------- | ------- | --------------------------- |
| 4863 | `ORDERS_POSTGRESQL_OAUTH_IDP_PORT` | RS256   | `orders-postgresql` (oauth) |

Started automatically by `npm run start`.

MCP host uses `ORDERS_POSTGRESQL_OAUTH_IDP_URL` (:4863). JWT helpers in [`jwt.mjs`](./jwt.mjs) / [`signing.mjs`](./signing.mjs).
