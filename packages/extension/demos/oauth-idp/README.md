# Demo OAuth IdP (RS256, port 4863)

| npm script       | Port | Env                              | Signing | MCP consumer    |
| ---------------- | ---- | -------------------------------- | ------- | --------------- |
| `demo:oauth-idp` | 4863 | `ORDERS_DATABASE_OAUTH_IDP_PORT` | RS256   | `orders` (oidc) |

Kill: `npm run demo:oauth-idp:kill`

MCP host uses `ORDERS_DATABASE_OAUTH_IDP_URL` (:4863). JWT helpers in [`jwt.mjs`](./jwt.mjs) / [`signing.mjs`](./signing.mjs).
