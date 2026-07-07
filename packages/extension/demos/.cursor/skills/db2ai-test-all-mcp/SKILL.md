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

Hook `.cursor/hooks/before-submit-test-all.sh` prueft bei Kurzformen, ob `.cursor/mcp.json` und der Skill vorhanden sind.

## Voraussetzungen

- Demos-Workspace-Root mit `.cursor/mcp.json`
- `npm run start:all` (foreground, all DBs + MCP hosts)
- Für tägliche MCP-Iteration nach Codegen: `npm run start:mcp` (alias `npm run start`; DBs/IdP müssen laufen)
- Fixtures separat im Hintergrund: `npm run start:fixtures`
- Alle benötigten MCP-Server in Cursor aktiviert
- Keine `.env`-Dateien lesen oder ändern (siehe `db2ai-env-auth-policy`)

## Geltende Regeln

- **Schema-only:** Parameter nur aus MCP-Tool-Descriptors (JSON Schema + Beispiele in `description`). Kein Repo-/DSL-Wissen.
- **Nur konfigurierte Server:** Eintraege in `.cursor/mcp.json` (`sakila-mysql`, `sakila-mariadb`, `pagila-postgresql`, `orders-postgresql`, `animals-sqlserver`, `plants-oracle`).
- **Kein Workaround bei Fehlern:** Kein CLI, kein SQL, kein Retry mit anderen Credentials.
- **Ausnahme zu „ein Aufruf“:** Bei diesem Skill genau **ein Aufruf pro Tool** — insgesamt alle Tools aller Server. Fehler pro Tool dokumentieren, mit naechstem Tool fortfahren (Server komplett down: Rest des Servers ueberspringen, Fehler melden).

## Ablauf

### 1. Server und Tools entdecken

1. `.cursor/mcp.json` lesen → Liste der `serverName`-Werte.
2. Pro Server alle Tool-Descriptors unter `mcps/<cursor-server-id>/tools/*.json` lesen (Schema vor jedem Aufruf).

### 2. Parameter

- Pflichtfelder aus Schema; fehlen Beispiele → kleinste sinnvolle Werte (`limit: 5`, `offset: 0`, `maxRows: 5`).
- **Read-Tools zuerst** (parallel pro Server moeglich).
- **Write-Tools:** create → update (ID aus Response) → delete (gleiche ID). Praefix `MCPTEST` in Namen.
- **orders-postgresql:** `listCustomerOrders` ohne `customerId` (JWT-Default). Admin-only-Tools einmal testen; bei `403` dokumentieren, nicht umgehen.
- **delete*** mit FK-Risiko: bevorzugt frisch erzeugte IDs; Schema-Beispiel `999` nur wenn kein create moeglich war.

### 3. Aufrufe

- Pro Tool: ein MCP-Aufruf; Fehler in der Zusammenfassung (Abschnitt 4) festhalten — **kein** vollstaendiger Audit-Block pro Tool.

### 4. Ergebnisbericht (einzige Ausgabe — kein Audit)

Kurz fuer den Nutzer:

```markdown
## Ergebnis: X/Y Tools erfolgreich

| Server | Tools | Status |
|--------|-------|--------|
| sakila-mysql | 7 | ✅ / ❌ |

### Auffaelligkeiten
- …
```

- Leere Listen (`rowCount: 0`) = OK, wenn kein Fehler.
- Schreib-Tests: temporaere Datensaetze wieder loeschen; verbleibende Test-Orders erwaehnen.
- **Kein** Abschnitt `Audit` und keine pro-Tool-`###`-Bloecke — nur diese Tabelle und `Auffaelligkeiten`. (Ausnahme zu `mcp-db2ai-only.mdc` nur fuer `/test-all`.)

## Checkliste

```
- [ ] mcp.json gelesen
- [ ] Alle Tool-Schemas gelesen
- [ ] Read-Tools aller Server aufgerufen
- [ ] Write-Tools (create/update/delete) getestet
- [ ] Zusammenfassungstabelle (kein Audit)
```
