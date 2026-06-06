# db2ai MCP demos

Workspace: `.db2ai` · MCP config: [`.cursor/mcp.json`](./.cursor/mcp.json)

## Quick start

- [ ] `npm install`
- [ ] `npm run init`
- [ ] Open this folder as Cursor workspace root
- [ ] Cursor Settings → Tools & MCPs: enable needed servers
- [ ] Reload MCP after `.env`, `mcp.json`, or tool changes in `.db2ai` (add, edit, remove)

`npm run demo:kill-all` · `init` does not overwrite `.env` · DB issues: `npm run db:kill:all` then `init`

## Init

- **`npm run init`** — setup + services in the **background**; terminal is free when done.
- **`npm run init:foreground`** — same, but logs stay in this terminal (`LOG_LEVEL=debug`, prefix per service). **Ctrl+C** stops services started here.

## Demos

One MCP server per row — names match `.cursor/mcp.json`.

| MCP server | DSL             | Transport | Auth   | Port | Credential / Prerequisites                                |
| ---------- | --------------- | --------- | ------ | ---- | --------------------------------------------------------- |
| `sakila`   | sakila          | stdio     | static | —    | Docker Sakila; demo token in `.env` (from `.env.example`) |
| `pagila`   | pagila          | HTTP      | static | 4853 | `init` starts host; API key in `mcp.json` `x-api-token`   |
| `orders`   | orders-database | OAuth     | oidc   | 4871 | `init` starts IdP + host; Cursor Sign-in (RS256 :4863)    |

---

#Col3:23
