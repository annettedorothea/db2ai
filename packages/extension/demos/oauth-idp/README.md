# OAuth IdP (db2ai demos)

| npm script       | Port | env var                          | Signing | MCP server      |
| ---------------- | ---- | -------------------------------- | ------- | --------------- |
| `demo:oauth-idp` | 4863 | `ORDERS_POSTGRES_OAUTH_IDP_PORT` | RS256   | `orders` (oidc) |

Started automatically by `npm run start`.

MCP host uses `ORDERS_POSTGRES_OAUTH_IDP_URL` (:4863). JWT helpers in [`jwt.mjs`](./jwt.mjs) / [`signing.mjs`](./signing.mjs).
