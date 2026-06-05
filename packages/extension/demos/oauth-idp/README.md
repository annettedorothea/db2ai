# oauth-idp

Shared mini OAuth 2.1 authorization server for MCP demo **`orders`** (oidc).

| Instance         | Port | Env                          | Sign alg | MCP demo        |
| ---------------- | ---- | ---------------------------- | -------- | --------------- |
| `demo:oauth-idp` | 4863 | `ORDERS_DEMO_OAUTH_IDP_PORT` | RS256    | `orders` (oidc) |

```bash
npm run demo:oauth-idp
```

MCP host uses `ORDERS_DEMO_OAUTH_IDP_URL` (:4863). JWT helpers in [`jwt.mjs`](./jwt.mjs) / [`signing.mjs`](./signing.mjs).
