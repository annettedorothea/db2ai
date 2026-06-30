# db2ai MCP demos

> **Pre-release** — demo workspace for trying db2ai; not a stability guarantee for production.

**Prerequisite:** demo workspace created via **db2ai: Create demo workspace** (VSIX extension).

[`.cursor/mcp.json`](./.cursor/mcp.json) · `.db2ai` workspace root

## Quick start

**Goal:** call one MCP tool from Cursor (`sakila-mysql`, MySQL Sakila sample DB).

1. **Docker Desktop** is running
2. Terminal in this folder:

```bash
npm install && npm run start:sakila-mysql
```

(`start:sakila-mysql` also runs `npm install` if you skip the line above — then Sakila container, generate, compile, and the HTTP MCP host on port 4852; does not start other databases)

3. Cursor → **Settings → Tools & MCP** → enable only **`sakila-mysql`** → **Reload MCP**
4. Chat (copy-paste — prefix **`db2ai`** activates the demo MCP rule):

```text
db2ai List five films from the Sakila database.
```

## What's next

| Step | MCP server          | Command                           | Notes                                                                                               |
| ---- | ------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------- |
| 1    | `sakila-mariadb`    | `npm run start:sakila-mariadb`    | Same MySQL container as `sakila-mysql`; separate HTTP host (port 4854)                              |
| 2    | `pagila-postgresql` | `npm run start:pagila-postgresql` | PostgreSQL + HTTP passthrough host                                                                  |
| 3    | `orders-postgresql` | `npm run start:orders-postgresql` | PostgreSQL + OAuth IDP + HTTP host; Cursor Sign-in                                                  |
| 4    | `animals-sqlserver` | `npm run start:animals-sqlserver` | SQL Server + HTTP host                                                                              |
| 5    | `plants-oracle`     | `npm run start:plants-oracle`     | Oracle — first pull can take several minutes; one-time `docker login container-registry.oracle.com` |
| 6    | all demos           | `npm run start:all`               | Full stack for `/test-all` (stops other demos first)                                                |

Per-demo starts do **not** stop databases or MCP hosts from other demos already running.

## All demos

All MCP servers use **HTTP** URLs in `.cursor/mcp.json` (no stdio / `${workspaceFolder}` paths). Background hosts are started by `npm run start:<demo>` or `npm run start:all`.

| MCP server          | DSL               | Database                         | Transport          | Port | Start command                     |
| ------------------- | ----------------- | -------------------------------- | ------------------ | ---- | --------------------------------- |
| `sakila-mysql`      | sakila-mysql      | MySQL (Sakila)                   | HTTP (passthrough) | 4852 | `npm run start:sakila-mysql`      |
| `sakila-mariadb`    | sakila-mariadb    | MariaDB (Sakila, same container) | HTTP (public)      | 4854 | `npm run start:sakila-mariadb`    |
| `pagila-postgresql` | pagila-postgresql | PostgreSQL (Pagila)              | HTTP (passthrough) | 4853 | `npm run start:pagila-postgresql` |
| `orders-postgresql` | orders-postgresql | PostgreSQL (orders)              | HTTP (oauth)       | 4871 | `npm run start:orders-postgresql` |
| `animals-sqlserver` | animals-sqlserver | SQL Server (animals)             | HTTP (public)      | 4855 | `npm run start:animals-sqlserver` |
| `plants-oracle`     | plants-oracle     | Oracle (plants)                  | HTTP (public)      | 4856 | `npm run start:plants-oracle`     |

Database URLs and HTTP ports in **`.env`** (see `.env.example`). Port numbers in `.env` must match the URLs in `.cursor/mcp.json`. Protected/checked tools: `src/hooks/db2ai/<module>/verify*Credentials.ts`.

## Open WebUI (native)

Test HTTP MCP demos in [Open WebUI](https://docs.openwebui.com/features/extensibility/mcp/) on the host (**no Docker**). Same MCP URLs as Cursor (`127.0.0.1`). The **`db2ai`** chat prefix does not apply here. **Docker Desktop** must be running for the database demos you enable.

Open WebUI is **not** part of the db2ai repo — only npm helper scripts live here. Install the app **once globally** on your Mac; api2ai demos use the same UI and data (`~/.open-webui-data`).

**Architecture:** One Open WebUI process on port `3000` talks to MCP hosts on `127.0.0.1:48xx` (native, not in Docker). You can start demos from db2ai or api2ai; whichever runs `npm run open-webui` first starts the UI (if the port is free). The second workspace only prints MCP hints for **its** servers. Add MCP servers from both projects manually in Admin → External Tools.

### 1. Install Open WebUI (once, globally)

You need **Python 3.11+** — macOS often ships 3.9.x only.

```bash
python3 --version   # must be ≥ 3.11
pipx install open-webui
open-webui --help   # new shell if command not found
```

Alternative: `python3 -m pip install --user open-webui`. Optional local fallback: `.open-webui-venv/` in this folder (gitignored).

Data and secret default to `~/.open-webui-data` and `~/.open-webui-secret`. Override with `OPEN_WEBUI_DATA_DIR` / `OPEN_WEBUI_SECRET_PATH`. If npm cannot find `open-webui`, set `OPEN_WEBUI_COMMAND` in `.env` (see `.env.example`).

**Migrate from an older local setup:** remove obsolete folders in this directory if present: `.open-webui-venv/`, `.open-webui-data/`, `.open-webui-secret` (global paths above replace them).

### 2. Start

```bash
npm run start:open-webui    # all DBs + MCP hosts + UI
# or: npm run start:all && npm run open-webui
```

UI: `http://127.0.0.1:3000` · Stop UI started by npm: `npm run open-webui:down` (uses `~/.open-webui.pid`)

If Open WebUI is **already listening** on `OPEN_WEBUI_PORT`, `npm run open-webui` leaves it running and prints MCP setup hints only (no kill/restart).

`npm run demo:kill-all` stops MCP hosts and, by default, Open WebUI. Set `OPEN_WEBUI_SKIP_KILL=1` in `.env` to keep the UI running while tearing down demos.

After `npm run start:all`, the terminal prints copy-paste values for External Tools.

### 3. Configure (three steps)

**A — External Tools (Admin)**  
Admin Settings → External Tools → MCP (Streamable HTTP). Add servers from the `npm run open-webui` output.

| Demo                | Auth      | Notes                                  |
| ------------------- | --------- | -------------------------------------- |
| `sakila-mysql`      | Header    | `{"x-api-token":"demo"}` (from `.env`) |
| `pagila-postgresql` | Header    | same                                   |
| `sakila-mariadb`    | None      | public HTTP                            |
| `animals-sqlserver` | None      | public HTTP                            |
| `plants-oracle`     | None      | public HTTP                            |
| `orders-postgresql` | OAuth 2.1 | see below                              |

- **Public / header auth:** URL (+ headers for passthrough demos) — no login.
- **OAuth** (`orders-postgresql`): see below. **Verify Connection** in Admin does not need an LLM.

**B — LLM (Admin)**  
Admin → Connections → add a model with **Function Calling = Native** (required for tool calls).

| Provider           | Setup                                                                                                                | Notes                                                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Groq** (free)    | OpenAI connection · URL `https://api.groq.com/openai/v1` · API key from [console.groq.com](https://console.groq.com) | Good default for demos. MCP adds many tokens — prefer **`llama-4-scout`** over large models (`qwen3-32b` hits TPM limits quickly). Enable **one tool** per test. |
| **Ollama** (local) | URL `http://127.0.0.1:11434`                                                                                         | No API limits; [ollama.com](https://ollama.com)                                                                                                                  |
| **OpenAI API**     | URL `https://api.openai.com/v1` · `sk-…` key                                                                         | Pay-per-use (~$0.15/$0.60 per 1M tokens for GPT-4o mini). **ChatGPT Plus is separate** — no API key included.                                                    |

**C — Chat**  
Tools from Admin are **not** auto-enabled. Per chat: in the message toolbar, **Integrations** (four-diamond grid icon beside **+** — not the plus button) → **Tools** → tick the server(s). If the list is empty, **reload the page** once or twice after saving External Tools in Admin. For OAuth tools, complete the browser login (`alice` / `bob` / `admin`). Do not set OAuth tools as model defaults — enable per chat only.

Example prompt after enabling `sakila-mysql`: _“List five films from Sakila.”_

### OAuth demo in Open WebUI

Add Open WebUI callbacks to **`.env`** (or `.env.local`), then restart demos:

```bash
OAUTH_IDP_REDIRECT_URIS=cursor://anysphere.cursor-mcp/oauth/callback,http://localhost:3000/oauth/clients/mcp:*,http://127.0.0.1:3000/oauth/clients/mcp:*
```

```bash
npm run demo:kill-all && npm run start:all
```

| Demo                | MCP URL                     | OAuth Server URL        |
| ------------------- | --------------------------- | ----------------------- |
| `orders-postgresql` | `http://127.0.0.1:4871/mcp` | `http://127.0.0.1:4863` |

Auth: **OAuth 2.1 (Static)** · Client ID `mcp-demo-local` · Client Secret `demo` (placeholder — IdP is a public client) · **Register Client** → Save.

### Troubleshooting

| Symptom                                       | Fix                                                               |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `Open WebUI is not installed`                 | `pipx install open-webui` or set `OPEN_WEBUI_COMMAND` in `.env`   |
| Tools in Admin but not in chat                | **Integrations** (diamond icon beside **+**) → **Tools** per chat |
| Tools missing under Integrations → Tools      | Reload page; confirm Admin save + `npm run start:all`             |
| Groq `Request too large` / TPM limit          | Smaller model (`llama-4-scout`), fewer tools, new chat            |
| `OAuth client registration is still invalid…` | Add `OAUTH_IDP_REDIRECT_URIS` above, restart demos                |
| OAuth tool fails mid-chat                     | Enable per chat (not as model default); re-login if token expired |
| MCP host not reachable                        | Start the demo DB + host (`npm run start:<demo>` or `start:all`)  |

## Scripts

| Command                      | Purpose                                                                 |
| ---------------------------- | ----------------------------------------------------------------------- |
| `npm run start:sakila-mysql` | `npm install` + Sakila DB + generate + compile + HTTP MCP host          |
| `npm run start:<demo>`       | One demo (see table above)                                              |
| `npm run start:all`          | All DBs + all MCP/IDP hosts (`npm run start` alias)                     |
| `npm run start:foreground`   | `start:all` with logs in this terminal                                  |
| `npm run start:open-webui`   | `start:all` then native Open WebUI + MCP setup hints                    |
| `npm run open-webui`         | Open WebUI only (expects MCP hosts already running)                     |
| `npm run open-webui:down`    | Stop Open WebUI started via npm (`~/.open-webui.pid`; keeps data)       |
| `npm run demo:kill-all`      | Stop MCP, IDP, Open WebUI (unless `OPEN_WEBUI_SKIP_KILL=1`), Docker DBs |
| `npm run db:down`            | Stop Docker containers only                                             |

Reload MCP after `.db2ai`, `mcp.json`, or `.env` changes.

Servers for demos you have not started yet (`start:<demo>` or `start:all`) may show errors in MCP settings — that is expected; only enable what is running, or run **`npm run start:all`** before `/test-all`.

## Chat prefix

Begin prompts with **`db2ai`** (e.g. `db2ai List five films…`) so the workspace rule applies and the agent uses only your configured MCP servers—not web search or other tools.

---

#Col3:23
