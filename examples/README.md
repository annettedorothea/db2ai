# db2ai examples

## Test-Datenbank: Pagila (lokales PostgreSQL)

[Pagila](https://github.com/devrimgunduz/pagila) ist eine PostgreSQL-Demo-Datenbank (DVD-Verleih, viele Tabellen und Foreign Keys). Für diese Beispiele läuft sie **ohne Docker** direkt auf deinem Rechner.

### 1. PostgreSQL installieren (macOS)

```bash
brew install postgresql@16
brew services start postgresql@16
```

`psql` muss im Terminal verfügbar sein. Bei Homebrew oft:

```bash
export PATH="/usr/local/opt/postgresql@16/bin:$PATH"   # Intel-Mac
# oder
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"  # Apple Silicon
```

Dauerhaft: dieselbe `export`-Zeile in `~/.zshrc` oder `~/.bash_profile` eintragen.

Prüfen:

```bash
psql --version
psql -d postgres -c 'SELECT version();'
```

Falls die Verbindung scheitert: Dienst neu starten mit `brew services restart postgresql@16`.

### 2. Pagila laden

Im Ordner `examples/`:

```bash
cd examples
npm run db:setup
```

Das Skript [`scripts/setup-pagila.sh`](scripts/setup-pagila.sh) klont die Pagila-SQL-Dateien von GitHub (nach `.pagila-src/`), legt die Datenbank `pagila` an und lädt Schema plus Beispieldaten.

Neu aufsetzen (DB löschen und erneut laden):

```bash
npm run db:reset
```

Interaktive Shell:

```bash
npm run db:psql
# dann z. B.: \dt   oder   SELECT count(*) FROM film;
```

### Verbindung (Umgebungsvariable)

Die DSL referenziert nur den **Namen** der Variable, nicht die URL:

```text
database env "PAGILA_DATABASE_URL"
```

[`.env`](.env) (Standard für lokales Setup):

```text
PAGILA_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pagila
```

CLI, Smoke und `mcp-serve` laden `.env` automatisch aus `examples/` (und Elternverzeichnissen).

| Feld | Wert |
|------|------|
| Host | `localhost` |
| Port | `5432` |
| DB | `pagila` |
| User | `postgres` |
| Passwort | `postgres` |

**Hinweis:** Homebrew-PostgreSQL nutzt oft zuerst deinen macOS-Benutzernamen. Das Setup-Skript legt die Rolle `postgres` mit Passwort `postgres` an, damit die URL in `.env` passt.

Port belegt? Anderen Port in PostgreSQL konfigurieren und in `.env` anpassen, z. B. `…@localhost:5433/pagila`.

Anderer DB-User? Beim Setup überschreiben:

```bash
PGUSER=meinuser PGPASSWORD=geheim npm run db:setup
```

Dann `PAGILA_DATABASE_URL` in `.env` entsprechend setzen.

### MCP-Tools generieren

Im **db2ai**-Workspace-Root:

```bash
export PAGILA_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pagila"
npm run generate:pagila
npm run test:smoke:pagila
```

Oder in der IDE: `.db2ai` speichern → Generate on Save, oder Command **Generate tool code**.

Ausgabe:

- `examples/generated/tools/pagila-tools.ts` / `.mjs`
- `examples/generated/cli/mcp-serve.mjs`

### Cursor MCP (`.cursor/mcp.json`)

[`.cursor/mcp.json`](.cursor/mcp.json) registriert Server `db2ai-pagila` (Pfade relativ zu `examples/`). Nach `generate:pagila` in Cursor MCP aktivieren.

### Beispiel-DSL

[`pagila.db2ai`](pagila.db2ai) — drei Tools (`listFilms`, `listActors`, `listCustomers`) mit Pagination (`limit` / `offset`, Default `limit` 100).

### npm-Skripte (examples/)

| Script | Wirkung |
|--------|---------|
| `db:setup` | Pagila-Schema und -Daten in lokales PostgreSQL laden |
| `db:reset` | Datenbank löschen und `db:setup` erneut ausführen |
| `db:psql` | `psql` gegen `pagila` (URL wie in `.env`) |
