---
name: db2ai-test-all-mcp
description: >-
    Smoke-test every MCP tool on every server configured in .cursor/mcp.json.
    Use when the user writes db2ai /test:all, db2ai test:all, db2ai teste alle
    tools, or asks to test all MCP servers or all db2ai demo tools.
disable-model-invocation: true
---

# db2ai — alle MCP-Tools testen

## Trigger

Nutzer schreibt z. B.:

- **`/test-all`** (Slash-Command in Cursor: `.cursor/commands/test-all.md`)
- `db2ai /test:all` / `/test:all` / `db2ai test:all`
- `db2ai teste alle tools` / `… aller mcp server`

Hook `.cursor/hooks/before-submit-test-all.sh` prueft bei Kurzformen, ob `.cursor/mcp.json`, der Skill vorhanden sind und HTTP-MCP-Ports lauschen (`scripts/check-mcp-ready.mjs`).

## Voraussetzungen

- Demos-Workspace-Root mit `.cursor/mcp.json`
- `npm run start:all` oder `npm run start:mcp` (foreground — **MCP-Banner in diesem Terminal**)
- DBs/IdP laufen (`start:all` oder `start:fixtures`)
- Alle benötigten MCP-Server in Cursor aktiviert
- Keine `.env`-Dateien lesen oder ändern (siehe `db2ai-env-auth-policy`)

## Vertrauensmodell (kurz)

| Was | Quelle | Sicher? |
|-----|--------|---------|
| **Tool-Aufrufe** | Live MCP `tools/call` in Cursor | **Ja** — nicht der `mcps/`-Cache |
| **Parameter-Schema** | `mcps/.../tools/*.json` | Nur fuer Argumente — **nicht** fuer Build |
| **Build-Referenz** | `start:mcp`/`start:all`-Terminal (Banner pro Server) | **Ja** — gleicher Prozess wie die HTTP-Hosts |

**Nicht** fuer Build: `serverInfo.version` (Agent sieht Initialize nicht), Cursor Settings-Tooltip, `mcps/`-Cache-Descriptions.

## Geltende Regeln

- **Schema-only:** Parameter nur aus MCP-Tool-Descriptors (JSON Schema + Beispiele in `description`). Kein Repo-/DSL-Wissen.
- **Nur konfigurierte Server:** Eintraege in `.cursor/mcp.json` (`sakila-mysql`, `sakila-mariadb`, `pagila-postgresql`, `orders-postgresql`, `animals-sqlserver`, `plants-oracle`).
- **Kein Workaround bei Fehlern:** Kein CLI, kein SQL, kein Retry mit anderen Credentials.
- **Kein Ersatz-Transport:** Wenn MCP-Tool-Aufrufe in dieser Session nicht verfuegbar sind → **sofort abbrechen** (Schritt 0). Nicht HTTP/curl/WebFetch zu URLs aus `mcp.json`, nicht `scripts/mcp-inspect.mjs`, nicht `generated/**`.
- **Ausnahme zu „ein Aufruf“:** Bei diesem Skill genau **ein Aufruf pro Tool** — insgesamt alle Tools aller Server. Fehler pro Tool dokumentieren, mit naechstem Tool fortfahren (Server komplett down: Rest des Servers ueberspringen, Fehler melden).

## Ablauf

### 0. Vorbedingung — MCP in Cursor (Pflicht)

**Sofort abbrechen**, wenn du fuer Server aus `.cursor/mcp.json` **keine MCP-Tool-Aufrufe** in dieser Session ausfuehren kannst — z. B. Cursor fragt, MCP-Server zu aktivieren, es stehen keine MCP-Tools bereit, oder du waerest gezwungen, stattdessen Shell/HTTP zu nutzen.

**Verboten als Workaround (auch teilweise):**

- Direkter HTTP/curl/WebFetch zu `url`-Einträgen aus `.cursor/mcp.json`
- `scripts/mcp-inspect.mjs` oder andere MCP-Protokoll-Skripte
- `invokeTool` / CLI / Import aus `generated/**`
- Tool-Schemas aus `mcps/*/tools/*.json` **allein** als „Test“ verkaufen — Lesen der Descriptors ist nur Vorbereitung fuer echte MCP-Aufrufe

**Abbruch-Meldung** (kurz, keine weiteren Schritte):

```markdown
## test-all abgebrochen

MCP-Server sind in Cursor nicht aktiviert oder nicht verbunden. `/test-all` laeuft nur ueber **MCP-Tool-Aufrufe** in dieser Session — kein direkter HTTP an die MCP-Hosts.

**Bitte:** Cursor Settings → MCP → alle Server aus `.cursor/mcp.json` aktivieren, ggf. MCP neu laden, dann `/test-all` erneut.
```

Der Hook prueft Ports und Dateien — **nicht**, ob Cursor die MCP-Server eingeschaltet hat.

### 1. Build-Referenz (einmal pro Server)

Aus dem **Foreground-Terminal** von `npm run start:mcp` oder `npm run start:all` (IDE-Terminal oder `terminals/*.txt` in dieser Session) — **pro HTTP-Server** die Banner-Zeilen `Version:` und `Build:` lesen und als eine Spalte notieren:

`1.0.0-rc.2 · 2026-07-09 07:45 (UTC+2)`

- **Nicht** aus Repo, `generated/**`, `mcps/`-Cache oder `serverInfo.version` (nicht lesbar).
- Fehlt das Terminal oder ein Banner fuer einen Server → in der Zusammenfassung `Build unbekannt (Terminal fehlt — start:mcp neu?)` — trotzdem Tool-Aufrufe starten, wenn MCP verbunden.

Alle db2ai-Demo-MCPs sind HTTP — jedes Banner gehoert zum **live** Host auf dem Port aus `mcp.json`.

### 2. Server und Tools entdecken

1. `.cursor/mcp.json` lesen → Liste der `serverName`-Werte.
2. Pro Server Tool-Descriptors unter `mcps/<cursor-server-id>/tools/*.json` lesen — **nur** fuer Parameter/Schema vor jedem Aufruf.

### 3. Parameter

- Pflichtfelder aus Schema; fehlen Beispiele → kleinste sinnvolle Werte (`limit: 5`, `offset: 0`, `maxRows: 5`).
- **Read-Tools zuerst** (parallel pro Server moeglich).
- **Write-Tools:** create → update (ID aus Response) → delete (gleiche ID). Praefix `MCPTEST` in Namen.
- **orders-postgresql:** `listCustomerOrders` ohne `customerId` (JWT-Default). Admin-only-Tools einmal testen; bei `403` dokumentieren, nicht umgehen.
- **delete*** mit FK-Risiko: bevorzugt frisch erzeugte IDs; Schema-Beispiel `999` nur wenn kein create moeglich war.

### 4. Aufrufe

- Pro Tool: **ein live MCP-Aufruf**; Ergebnis in **Zusammenfassung** (Abschnitt 5) und **kompaktem Audit** (Abschnitt 6).
- **Kein** voller Audit mit `###`-Block und Roh-JSON pro Tool.

### 5. Ergebnisbericht

```markdown
## Ergebnis: X/Y Tools erfolgreich

| Server | Build (Terminal) | Tools | Status |
|--------|------------------|-------|--------|
| sakila-mariadb | 1.0.0-rc.2 · 2026-07-09 07:45 … | 3 | ✅ / ❌ |

- **Build (Terminal):** aus Schritt 1 — Banner des laufenden `start:mcp`/`start:all`-Prozesses, nicht Cache.

### Auffaelligkeiten
- …
```

- Leere Listen (`rowCount: 0`) = OK, wenn kein Fehler.
- Schreib-Tests: temporaere Datensaetze wieder loeschen; verbleibende Test-Orders erwaehnen.

### 6. Audit (kompakt)

Eine Zeile **pro MCP-Aufruf** — **ohne** Build-Spalte (steht oben pro Server):

```markdown
## Audit (kompakt)

| Server | Tool | Status | Notiz |
|--------|------|--------|-------|
| sakila-mariadb | searchFilms | ✅ | rowCount 5 |
| orders-postgresql | listCustomerOrders | ❌ | 403 |
```

- **Server:** `serverName` aus `.cursor/mcp.json` (nicht Cursor-`serverIdentifier`).
- **Tool:** technischer Toolname.
- **Status:** ✅ / ❌ / ⏭️ uebersprungen.
- **Notiz:** **eine Zeile** — Fehlermeldung, `rowCount`, oder „leer OK“; **kein** vollstaendiges JSON.
- Sortierung: Server (wie in `mcp.json`), dann Aufrufreihenfolge.

**Kein** zusaetzlicher Voll-Audit (`###` + Bullet-Listen + Rohantwort). Ausnahme zu `mcp-db2ai-only.mdc` nur fuer `/test-all`.

## Checkliste

```
- [ ] Schritt 0: MCP-Tools in Cursor verfuegbar (sonst Abbruch)
- [ ] Schritt 1: Build (Terminal) pro Server notiert
- [ ] mcp.json gelesen
- [ ] Alle Tool-Schemas gelesen (nur Parameter)
- [ ] Read-Tools aller Server aufgerufen (live MCP)
- [ ] Write-Tools (create/update/delete) getestet
- [ ] Zusammenfassungstabelle + kompakter Audit
```
