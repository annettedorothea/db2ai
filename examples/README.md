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

Das Skript `[scripts/setup-pagila.sh](scripts/setup-pagila.sh)` klont die Pagila-SQL-Dateien von GitHub (nach `.pagila-src/`), legt die Datenbank `pagila` an und lädt Schema plus Beispieldaten.

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

`[.env](.env)` (Standard für lokales Setup):

```text
PAGILA_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pagila
```

CLI, Smoke und `mcp-serve` laden `.env` automatisch aus `examples/` (und Elternverzeichnissen).


| Feld     | Wert        |
| -------- | ----------- |
| Host     | `localhost` |
| Port     | `5432`      |
| DB       | `pagila`    |
| User     | `postgres`  |
| Passwort | `postgres`  |


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

`[.cursor/mcp.json](.cursor/mcp.json)` registriert Server `db2ai-pagila` (Pfade relativ zu `examples/`). Nach `generate:pagila` in Cursor MCP aktivieren.

### Beispiel-DSL

`[pagila.db2ai](pagila.db2ai)` — Tools (`listFilms`, `listActors`, …) mit Pagination (`limit` / `offset`, Default `limit` 100).

Optional kann pro Query ein `**columns`-Block** die zurückgegebenen Spalten für den Agent dokumentieren (SQL bleibt `SELECT `*):

```text
columns: {
    actor_id: "Primary key"
    first_name: "Given name"
}
```

Spaltennamen werden gegen das Schema in PostgreSQL geprüft; Autocomplete im Editor nutzt dieselbe `PAGILA_DATABASE_URL` aus `.env` (wie Tabellennamen nach `FROM`).

### SQL-Tools (`SQL { … }`)

Für komplexere Abfragen: freier SQL-Text in `query` mit PostgreSQL-Platzhaltern `$1`, `$2`, … und Doku in `params`. In `[pagila.db2ai](pagila.db2ai)` gibt es drei Beispiele:


| Tool                     | Zweck                                           |
| ------------------------ | ----------------------------------------------- |
| `filmsByMpaaRating`      | Filter auf MPAA-Enum (`G`, `PG`, `PG-13`, …)    |
| `filmsWithActorLastName` | Join `actor` ↔ `film_actor` ↔ `film`            |
| `searchFilms`            | Freitext in `title` und `description` (`ILIKE`) |


- Kein SQL-Autocomplete; der Validator prüft nur, dass jedes `$n` in `query` einen Eintrag in `params` hat (und umgekehrt).
- Smoke-Beispiele:
  - `db2ai invoke filmsByMpaaRating '{"param1":"PG-13","param2":"20"}'`
  - `db2ai invoke filmsWithActorLastName '{"param1":"GAR","param2":"25"}'`
  - `db2ai invoke searchFilms '{"param1":"dragon","param2":"15"}'`

### MCP-Server in diesem Workspace


| Server         | Auth           | Voraussetzung                                                |
| -------------- | -------------- | ------------------------------------------------------------ |
| `db2ai-pagila` | — (PostgreSQL) | `PAGILA_DATABASE_URL`, `npm run db:setup`, `generate:pagila` |


Cursor: Workspace `**examples**` öffnen, MCP-Server aktivieren, nach DSL-Änderung regenerieren und MCP neu laden.

---

## Demo-Prompts (`db2ai`-Prefix)

Alle Prompts mit `**db2ai**` beginnen — dann greift `[.cursor/rules/mcp-db2ai-only.mdc](.cursor/rules/mcp-db2ai-only.mdc)` (nur `db2ai*`-MCPs, Antworten mit Audit, kein Web-Fallback). Der Agent wählt Tools anhand der MCP-Tool-Schemas (Name, Beschreibung, JSON-Parameter).

### MPAA-Bewertung

- `db2ai gib mir 20 R rated filme`
- `db2ai welche Filme haben die Bewertung PG-13? Zeig mir 15.`

→ Tool `filmsByMpaaRating` (`param1`: Rating, `param2`: max. Zeilen). CLI:  
`db2ai invoke filmsByMpaaRating '{"param1":"R","param2":"20"}'`

### Freitext in Titel oder Beschreibung

- `db2ai suche in den Filmen nach grace`
- `db2ai suche nach Filmen mit Hunden oder Katzen`

→ Tool `searchFilms` (englische Begriffe in Pagila, z. B. `dog`, `cat`; Substring-Treffer — „cat“ kann auch in *catch*, *Convention* vorkommen). CLI:  
`db2ai invoke searchFilms '{"param1":"grace","param2":"100"}'`

### Schauspieler ↔ Filme

- `db2ai in welchen Filmen spielt Penelope Guiness mit?`

→ Tool `filmsWithActorLastName` (`param1`: Nachnamen-**Präfix**, z. B. `GUI` für GUINESS; Antwort enthält `first_name`, `last_name`, `title`). In Pagila heißt die Schauspielerin **PENELOPE GUINESS**. CLI:  
`db2ai invoke filmsWithActorLastName '{"param1":"GUI","param2":"200"}'`

### Listen mit Pagination (`SELECT `*)

- `db2ai gib mir alle Infos zu Film mit id 59`

→ Kein Tool „Film nach ID“; `listFilms` mit `limit` / `offset` durchsuchen (oder `searchFilms`, wenn Titel/Beschreibung bekannt). Volle Spalten (`description`, `special_features`, …). CLI:  
`db2ai invoke listFilms '{"limit":100,"offset":0}'`

Weitere Listen-Tools: `listActors`, `listCustomers`, `listCategories`, `listCountries`, `listInventory` — jeweils `limit` (Default 100) und `offset`.

### Kombiniert (mehrere Tools)

- `db2ai zeig mir 10 R-Filme und suche darunter nach army`
- `db2ai welche PG-Filme mit einem Hund in der Beschreibung gibt es? Such mit dog, limit 50.`

Der Agent kann nacheinander `filmsByMpaaRating` und `searchFilms` (oder `listFilms` + Filter in der Antwort) nutzen — nur Parameter, die im MCP-Schema stehen.

---

### npm-Skripte (examples/)


| Script     | Wirkung                                              |
| ---------- | ---------------------------------------------------- |
| `db:setup` | Pagila-Schema und -Daten in lokales PostgreSQL laden |
| `db:reset` | Datenbank löschen und `db:setup` erneut ausführen    |
| `db:psql`  | `psql` gegen `pagila` (URL wie in `.env`)            |


