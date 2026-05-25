---
name: db2ai columns block
overview: 'Erweiterung der db2ai-DSL um optionalen Block `columns: { spalte: "Beschreibung" }` im Tool-Metadaten-Objekt. Spaltennamen werden per Schema-Introspection (information_schema.columns) validiert und per Autocomplete vorgeschlagen — Kontext ist die Tabelle aus `SELECT * FROM …`. `SELECT *` und generiertes SQL bleiben unverändert; die Map fließt in die MCP-Tool-Beschreibung.'
todos:
    - id: schema-columns-by-table
      content: 'schema.ts: information_schema.columns → columnsByTable, hasColumn/columnsForTable, Cache + Test-Mocks'
      status: completed
    - id: grammar-columns-block
      content: 'Langium: columns + ColumnDescriptions/ColumnDescriptionEntry; langium:generate; Parsing-Tests'
      status: completed
    - id: validator-column-keys
      content: 'Validator: unbekannte/doppelte Spalten-Keys; QUERY_BLOCK_KEYS + columns'
      status: completed
    - id: completion-column-keys
      content: 'Completion: tabellenbezogene Spalten-Keys in columns-Map, minus bereits gesetzte Keys'
      status: completed
    - id: codegen-description-columns
      content: buildDescription + pagila.db2ai + README; build/smoke
      status: completed
isProject: false
---

# Plan: `columns`-Block mit tabellenbezogener Autocomplete

**Status: umgesetzt**

## Zielsyntax (Beispiel)

```db2ai
SELECT * FROM actor {
    toolName: "listActors"
    intent: "list actors with pagination"
    summary: "Paginated actor rows"
    maxLimit: 500
    columns: {
        actor_id: "Primary key"
        first_name: "Given name"
        last_name: "Family name"
    }
}
```

- **`SELECT * FROM actor`** bleibt wie heute — keine Änderung an der SQL-Projektion.
- **`columns`** ist **optional** (wie `example` / `summary`).
- **Keys** = echte Spaltennamen der Tabelle `actor`; **Values** = freie Agent-Beschreibung (`STRING`).

## Abgrenzung zu anderen Plänen

| Thema            | Dieser Plan                  | [`db2ai_select_spalten`](../../api2ai/.cursor/plans/db2ai_select_spalten_9549000c.plan.md) | [`db2ai_hybrid_sql`](../../api2ai/.cursor/plans/db2ai_hybrid_sql_d922a1c7.plan.md) |
| ---------------- | ---------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Spalten in DSL   | Metadaten-Map im `{ }`-Block | `SELECT col1, col2 FROM t`                                                                 | `columnsDoc: "..."` (ein String)                                                   |
| SQL zur Laufzeit | weiter `SELECT *`            | dynamische Spaltenliste                                                                    | je nach Tool-Typ                                                                   |
| Autocomplete     | Keys in `columns: { }`       | zwischen `SELECT` und `FROM`                                                               | —                                                                                  |

Die Pläne können später kombiniert werden; dieser Schritt braucht **kein** `SelectList` in der Grammar.

```mermaid
flowchart LR
    subgraph dsl [DSL Block]
        Q["SELECT * FROM actor"]
        C["columns: { actor_id: \"...\" }"]
    end
    subgraph lsp [Language Server]
        S[loadSchema columnsByTable]
        V[Validator hasColumn]
        A[Completion Spalten-Keys]
    end
    subgraph out [Codegen]
        D[MCP tool description]
        SQL["SELECT * FROM actor LIMIT/OFFSET"]
    end
    Q --> S
    C --> V
    C --> A
    S --> V
    S --> A
    C --> D
    Q --> SQL
```

---

## 1. Schema: Spalten laden

Datei: [`packages/language/src/schema.ts`](../../packages/language/src/schema.ts)

**Heute:** nur `tables: string[]` aus `information_schema.tables`.

**Erweiterung:**

```typescript
export type LoadedSchema = {
    tables: string[];
    columnsByTable: Record<string, string[]>;
};
```

- Zusätzliche Query (gleiche Connection, ein Cache-Eintrag pro URL):

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

- Hilfsfunktionen: `columnsForTable(loaded, table)`, `hasColumn(loaded, table, column)`
- Bestehende `hasTable` unverändert

**Tests:** Mock in [`packages/language/test/completions.test.ts`](../../packages/language/test/completions.test.ts) und [`validating.test.ts`](../../packages/language/test/validating.test.ts) um `columnsByTable` ergänzen (z. B. `actor: ['actor_id', 'first_name', 'last_name']`).

---

## 2. Grammar + AST

Datei: [`packages/language/src/db-2-ai-dsl.langium`](../../packages/language/src/db-2-ai-dsl.langium)

Neue Regeln in der `Query`-Alternation:

```langium
| 'columns' ':' columns=ColumnDescriptions

ColumnDescriptions:
    '{' (entries += ColumnDescriptionEntry)* '}';

ColumnDescriptionEntry:
    name=ID ':' description=STRING;
```

- `langium:generate` → `Query.columns?: ColumnDescriptions`, `ColumnDescriptionEntry` mit `name` + `description`
- Parser-Tests in [`packages/language/test/parsing.test.ts`](../../packages/language/test/parsing.test.ts): gültiger Block, leere Map `{}`, mehrere Einträge

**Duplicate-Detection (Top-Level):** `QUERY_BLOCK_KEYS` in [`db-2-ai-dsl-validator.ts`](../../packages/language/src/db-2-ai-dsl-validator.ts) um `'columns'` erweitern (bestehendes CST-Scan-Muster).

**Duplicate-Detection (Map-Keys):** separater Check über `query.columns.entries` — doppelte `name` → Error (analog zu doppeltem `toolName` im Block).

---

## 3. Validator

Datei: [`db-2-ai-dsl-validator.ts`](../../packages/language/src/db-2-ai-dsl-validator.ts)

Neue Methode `checkColumnKeysExist` (in `checkModel`, nach `checkTablesExist` oder darin gebündelt):

| Regel                | Schwere            | Bedingung                                                                                              |
| -------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| Unbekannte Spalte    | `error`            | `columns` gesetzt, Block `{` da, DB/Schema OK, `hasColumn(loaded, query.table.name, entry.name)` false |
| Doppelter Key in Map | `error`            | zwei `entries` mit gleichem `name`                                                                     |
| Leere Map            | optional `warning` | `columns: { }` — kann weggelassen (PoC)                                                                |

Gleiche **Graceful-Degradation** wie bei Tabellen: kein Env / DB nicht erreichbar → keine Spalten-Errors, nur bestehende Warnings; kein Block `{` → keine Spaltenprüfung.

Spaltenprüfung nur, wenn **`query.table.name`** bereits parsebar ist und Tabelle im Schema existiert (sonst zuerst Tabellen-Fehler).

---

## 4. Completion (Autocomplete)

Datei: [`db-2-ai-dsl-completion-provider.ts`](../../packages/language/src/db-2-ai-dsl-completion-provider.ts)

**Pipeline** (wie Tabellen-Completion): `resolveDatabaseUrlFromEnvForDocument` → `loadSchema` → Kandidatenliste.

**Query-Auflösung:** Primär `AstUtils.getContainerOfType(leaf, isQuery)` (Cursor im Tool-Block). Fallback: bestehende `findQueryForTableCompletion` / Offset-Heuristik.

**Region „Spalten-Key“** (neue Hilfsfunktion, z. B. `findColumnKeyCompletionContext`):

- Cursor innerhalb `ColumnDescriptions`-CST der aktuellen `Query`
- Situationen:
    - direkt nach `columns: {` (neuer Key)
    - nach Zeilenumbruch/Komma vor `:` (neuer Key)
    - auf/teilweise im `ID`-Leaf eines Eintrags (Prefix-Filter + `TextEdit.replace`, analog [`tableNameLeaf`](../../packages/language/src/db-2-ai-dsl-completion-provider.ts))

**Kandidaten:** `columnsForTable(loaded, query.table.name)` minus bereits verwendete Keys in derselben `columns`-Map (andere `entries[].name`).

**Items:** `CompletionItemKind.Property`, `detail: 'PostgreSQL column'`, `sortText: '0'`.

**Priorität in `getCompletion`:** zuerst Spalten-Items, dann Tabellen-Items, dann `super.getCompletion` (Keywords wie `columns`, `toolName`, …).

**Tests** in [`completions.test.ts`](../../packages/language/test/completions.test.ts):

- Nach `columns: { ` mit bekannter Tabelle → Labels enthalten `actor_id`
- Bereits eingetragener Key wird nicht erneut vorgeschlagen
- Ohne Tabelle / vor `FROM` → keine Spalten-Items (nur Tabellen wie bisher)

---

## 5. Codegen / MCP-Beschreibung

Dateien: [`packages/cli/src/db-query-codegen.ts`](../../packages/cli/src/db-query-codegen.ts)

`buildDescription(query)` erweitern:

- Wenn `query.columns?.entries.length`:
    - Abschnitt z. B. `Columns returned:` mit Bullet-Liste `column_name — description`
- SQL-Text in der Description bleibt `SELECT * FROM public.<table> …` (kein Schema-Zugriff im CLI nötig)

**Runtime-SQL** in [`generator.ts`](../../packages/cli/src/generator.ts): unverändert `SELECT * FROM …`.

---

## 6. Beispiele & Doku

- [`packages/extension/demos/pagila.db2ai`](../../packages/extension/demos/pagila.db2ai): `columns`-Block beim `actor`-Query (3–4 Spalten)
- [`packages/extension/demos/README.md`](../../packages/extension/demos/README.md): kurzer Abschnitt zu `columns`, Voraussetzung `.env` + Pagila für Autocomplete/Validation

---

## 7. Build & Smoke

Nach Implementierung (Workspace-Regel):

```bash
cd db2ai && npm run langium:generate && npm run build
```

- `npm test` in `packages/language`
- `npm run generate:pagila` (oder bestehendes Smoke-Skript) — MCP-Description enthält Spaltenhilfe

---

## Umsetzungsreihenfolge

1. `schema.ts` + `columnsByTable` + Tests-Mocks
2. Grammar + `langium:generate` + Parsing-Tests
3. Validator (Map-Duplikate + `hasColumn`)
4. Completion (Spalten-Keys, Filter bereits genutzter Keys)
5. Codegen `buildDescription` + `pagila.db2ai` + README
6. `langium:generate && build` + Smoke
