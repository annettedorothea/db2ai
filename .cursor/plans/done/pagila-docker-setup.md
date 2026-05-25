---
name: Pagila Docker Setup
overview: 'Pagila in db2ai-examples ausschließlich per Docker Desktop (synthesizedio/pagila:1.2). Alle lokalen/Homebrew-/setup-pagila-Reste entfernen. Docker auf dem Mac verifiziert (Desktop 4.26.1).'
todos:
    - id: preflight-docker
      content: 'Docker Desktop verifiziert (4.26.1, pull pagila:1.2 OK; Compose braucht POSTGRES_DB=pagila)'
      status: completed
    - id: compose-and-scripts
      content: docker-compose.yml + wait-for-pagila.sh + package.json (nur db:up/down/reset/psql); setup-pagila.sh löschen
      status: completed
    - id: remove-local-remnants
      content: READMEs, extension README, .gitignore (.pagila-src), SQLTools — keine brew/psql/setup-Hinweise
      status: completed
    - id: env-align
      content: '.env + healthcheck: POSTGRES_DB=pagila; erste Startzeit ~50s in wait-Skript'
      status: completed
    - id: verify-mcp-smoke
      content: npm run db:up + test:smoke:pagila + Cursor db2ai-Prompt
      status: completed
isProject: false
---

# Pagila nur per Docker (db2ai examples)

## Docker-Check auf deinem Mac (erledigt)

| Prüfung                                | Ergebnis                                                |
| -------------------------------------- | ------------------------------------------------------- |
| Docker Client                          | 24.0.7, Context `desktop-linux`                         |
| Docker Server                          | **Docker Desktop 4.26.1** — Daemon läuft                |
| Docker Compose                         | v2.23.3-desktop.2                                       |
| `docker pull synthesizedio/pagila:1.2` | OK                                                      |
| Container-Start                        | OK mit `POSTGRES_DB=pagila` (siehe unten)               |
| Daten                                  | `SELECT count(*) FROM film` → **1000** (nach ~50s Init) |

**Wichtig für Compose:** Ohne `POSTGRES_DB=pagila` legt das Image nur die DB `postgres` an; Tabellen stehen dann dort, aber [packages/extension/demos/.env](packages/extension/demos/.env) zeigt auf `/pagila` → Verbindung schlägt fehl. Im `docker-compose.yml` zwingend:

```yaml
environment:
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: pagila
```

Healthcheck: `pg_isready -U postgres -d pagila`.

Erste Inbetriebnahme dauert **ca. 45–60 Sekunden** (Schema/Daten im Image) — `wait-for-pagila.sh` entsprechend timeout setzen.

---

## Zielbild

Einziger Weg, Pagila zu starten:

```bash
cd packages/extension/demos
npm install
npm run db:up
```

Weitere Skripte: `db:down`, `db:reset`, `db:psql` (alles über `docker compose` / `docker compose exec`).

**Voraussetzungen:** Node.js 20+, **Docker Desktop** (läuft), Workspace `packages/extension/demos/` für MCP.

**Nicht mehr im Repo:** Homebrew-PostgreSQL, host-`psql`, `setup-pagila.sh`, `.pagila-src`-Clone, `db:setup` als separates lokales Setup.

```mermaid
flowchart LR
  dev[Entwickler] -->|"npm run db:up"| compose[docker compose]
  compose --> img["synthesizedio/pagila:1.2"]
  img -->|":55432"| host[localhost:55432/pagila]
  host --> mcp[db2ai-pagila MCP]
```

---

## 1. Neue Dateien

### [packages/extension/demos/docker-compose.yml](packages/extension/demos/docker-compose.yml)

```yaml
services:
    pagila:
        image: synthesizedio/pagila:1.2
        container_name: db2ai-pagila
        environment:
            POSTGRES_PASSWORD: postgres
            POSTGRES_DB: pagila
        ports:
            - '${PAGILA_HOST_PORT:-55432}:5432'
        healthcheck:
            test: ['CMD-SHELL', 'pg_isready -U postgres -d pagila']
            interval: 5s
            timeout: 5s
            retries: 30
            start_period: 60s
        restart: unless-stopped
```

`db:reset`: `docker compose down -v` + `db:up` (falls Named Volume ergänzt wird; bei reinem Container-Recreate ggf. nur `down` + `up`).

### [packages/extension/demos/scripts/wait-for-pagila.sh](packages/extension/demos/scripts/wait-for-pagila.sh)

- Prüft `docker` / `docker compose`
- Wartet auf `healthy` oder `pg_isready` via `docker compose exec`
- Klare Fehler: Docker Desktop nicht gestartet, Port 55432 belegt

---

## 2. Entfernen (keine lokalen Reste)

| Aktion                         | Datei / Stelle                                                                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Löschen**                    | [packages/extension/demos/scripts/setup-pagila.sh](packages/extension/demos/scripts/setup-pagila.sh)                                      |
| **Entfernen aus package.json** | `db:setup`, altes `db:reset`/`db:psql` mit host-`psql`                                                                                    |
| **Neu in package.json**        | `db:up`, `db:down`, `db:reset`, `db:psql` (nur Docker)                                                                                    |
| **README**                     | [packages/extension/demos/README.md](packages/extension/demos/README.md): gesamter Homebrew/`db:setup`-Block streichen                    |
| **README**                     | [README.md](../README.md): nur `npm run db:up`, kein lokales Postgres                                                                     |
| **Extension**                  | [packages/extension/README.md](packages/extension/README.md): „Docker: cd packages/extension/demos && npm run db:up“ statt lokales Pagila |
| **.gitignore**                 | Eintrag `packages/extension/demos/.pagila-src/` entfernen (Ordner nicht mehr genutzt)                                                     |
| **Optional löschen**           | Lokaler Ordner `packages/extension/demos/.pagila-src/` auf der Platte (gitignored, manuell)                                               |

Kein „Optional: lokales PostgreSQL“, kein `db:setup`-Alias, keine Colima-Erwähnung.

---

## 3. Dokumentation (nur Docker)

### [packages/extension/demos/README.md](packages/extension/demos/README.md)

Getting started:

1. Docker Desktop starten
2. `cd packages/extension/demos && npm install && npm run db:up`
3. `PAGILA_DATABASE_URL` in [.env](packages/extension/demos/.env) (unverändert: `…/pagila`)
4. Repo root: `npm run generate:pagila`
5. Cursor: MCP `db2ai-pagila` aktivieren

Troubleshooting:

- Port 55432 belegt → `PAGILA_HOST_PORT=55433` + `.env` anpassen
- Erster Start langsam (~1 Min.)
- Image-Quelle: [synthesizedio/pagila](https://hub.docker.com/r/synthesizedio/pagila) Tag `1.2`

### [packages/extension/demos/.env.example](packages/extension/demos/.env.example) (neu)

`PAGILA_DATABASE_URL=postgresql://postgres:postgres@localhost:55432/pagila`

---

## 4. MCP

[packages/extension/demos/.cursor/mcp.json](packages/extension/demos/.cursor/mcp.json) unverändert lassen, solange Workspace = `examples` und `.env` existiert.

Optional nach Test: `"env"` mit URL in `mcp.json` — nur bei Bedarf.

---

## 5. Verifikation nach Implementierung

```bash
cd packages/extension/demos && npm run db:up
npm run db:psql   # \dt → film, actor, …
cd .. && npm run test:smoke:pagila
```

Cursor: `db2ai gib mir 5 filme`

---

## Erfolgskriterien

1. Keine Datei/Skript/Doku mehr für lokales PostgreSQL oder `setup-pagila.sh`.
2. `npm run db:up` allein reicht auf deinem Mac (Docker Desktop 4.26.1).
3. MCP-Tools verbinden zu `localhost:55432/pagila` mit Daten.
