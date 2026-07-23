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
- Stack laeuft (HTTP-MCP-Ports erreichbar; Hook prueft das):
  - **Monorepo:** Repo-Root `npm run start:all:demos` (lokale CLI; Stop: `npm run kill:all:demos`) — oft in einem anderen Fenster/Terminal als `/test-all`
  - **Author / Create Demo Workspace:** `npm run start:all` oder `npm run start:mcp` (VSIX-CLI; ohne installierte Extension schlaegt Generate fehl)
- DBs/IdP laufen (Teil von `start:all` / `start:all:demos`, oder `start:fixtures`)
- Alle benötigten MCP-Server in Cursor aktiviert
- Keine `.env`-Dateien lesen oder ändern (siehe `db2ai-env-auth-policy`)

## Vertrauensmodell (kurz)

| Was | Quelle | Sicher? |
|-----|--------|---------|
| **Tool-Aufrufe** | Live MCP `tools/call` in Cursor | **Ja** — nicht der `mcps/`-Cache |
| **Parameter-Schema** | `mcps/.../tools/*.json` | Nur fuer Argumente — kann **veraltet** sein (Cursor-Cache) |
| **Build (optional)** | Nur wenn Start-Terminal **in dieser Session** sichtbar (selten) | Sonst weglassen |

**Nicht** fuer Build: Terminal in anderen Fenstern suchen, Repo, `generated/**`, `mcps/`-Cache, `serverInfo.version`, Cursor Settings-Tooltip.

## Geltende Regeln

- **Schema-only:** Parameter nur aus MCP-Tool-Descriptors (JSON Schema + Beispiele in `description`). Kein Repo-/DSL-Wissen.
- **Nur konfigurierte Server:** Eintraege in `.cursor/mcp.json` (aktuell u. a. `sakila-mysql`, `sakila-mariadb`, `pagila-postgresql`, `orders-postgresql`, `animals-sqlserver`, `plants-oracle`, `flight`, `sales-report`). Keine feste Teilmenge — immer die Datei lesen.
- **Kein Workaround bei Fehlern:** Kein CLI, kein SQL, kein Retry mit anderen Credentials.
- **Kein Ersatz-Transport:** Wenn MCP-Tool-Aufrufe in dieser Session nicht verfuegbar sind → **sofort abbrechen** (Schritt 0). Nicht HTTP/curl/WebFetch zu URLs aus `mcp.json`, nicht `scripts/mcp-inspect.mjs`, nicht `generated/**`.
- **Ausnahme zu „ein Aufruf“:** Bei diesem Skill genau **ein Aufruf pro Tool** — insgesamt alle Tools aller Server. Fehler pro Tool dokumentieren, mit naechstem Tool fortfahren (Server komplett down: Rest des Servers ueberspringen, Fehler melden).
- **Kein Terminal-Hunt:** Nicht nach `start:all`/`start:all:demos`-Terminals suchen, wenn sie nicht offensichtlich in dieser Session liegen. Sofort mit Tool-Tests starten.
- **Stale Cursor-Cache (nicht DSL-Bug):** Wenn die **Live**-Antwort (Zod/Validierung, fehlendes Pflichtfeld, unerwartetes Schema) ein Feld verlangt oder ablehnt, das im `mcps/.../tools/*.json`-Descriptor **fehlt bzw. anders** ist → **veralteter Cursor-Tool-Cache**. In Auffaelligkeiten + Audit so melden. **Nicht** DSL aendern, **nicht** `generated/**` hand-editen, **nicht** Parameter „erraten“ aus dem Repo. Nutzer: MCP-Server togglen/reloaden (ggf. Hosts neu starten), dann `/test-all` erneut.

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

### 1. Build-Referenz (optional — ueberspringen ist Normalfall)

**Standard:** Schritt ueberspringen. Kein Terminal lesen, keine Banner suchen. In der Zusammenfassung Build-Spalte weglassen oder `—`.

**Nur wenn** in **dieser** Cursor-Session ein Foreground-`start:all` / `start:mcp` (typisch Author/VSIX im gleichen Fenster) klar sichtbar ist: Banner `Version:` / `Build:` pro Server notieren.

Monorepo `start:all:demos` laeuft oft woanders — **nicht** danach suchen.

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
- Schema-Mismatch Descriptor vs. Live-Fehler → Regel **Stale Cursor-Cache** (nicht als Generator-/DSL-Fehler verkaufen).

### 5. Ergebnisbericht

```markdown
## Ergebnis: X/Y Tools erfolgreich

| Server | Tools | Status |
|--------|-------|--------|
| sakila-mariadb | 3 | ✅ / ❌ |

### Auffaelligkeiten
- …
```

Optional eine Spalte **Build**, nur wenn Schritt 1 etwas geliefert hat.

- Leere Listen (`rowCount: 0`) = OK, wenn kein Fehler.
- Schreib-Tests: temporaere Datensaetze wieder loeschen; verbleibende Test-Orders erwaehnen.
- Stale-Cache-Verdacht z. B.: `listFilms: Live verlangt offset, Descriptor ohne offset — Cursor MCP reload`.

### 6. Audit (kompakt)

Eine Zeile **pro MCP-Aufruf**:

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
- [ ] Schritt 1: Build nur wenn Start-Terminal in dieser Session (sonst skip)
- [ ] mcp.json gelesen
- [ ] Tool-Schemas gelesen (nur Parameter, kurz)
- [ ] Read-Tools aller Server aufgerufen (live MCP)
- [ ] Write-Tools (create/update/delete) getestet
- [ ] Schema-Mismatch Live vs. Descriptor → stale Cache gemeldet (kein DSL-Fix)
- [ ] Zusammenfassungstabelle + kompakter Audit
```
