# CLI (`db-2-ai-dsl-cli`)

**`parse`**, **`validate`**, and **`generate`** for `.db2ai` files (repo root, after build):

```bash
npx db-2-ai-dsl-cli parse <file.db2ai>
npx db-2-ai-dsl-cli validate <file.db2ai>
npx db-2-ai-dsl-cli generate <source.db2ai> <dest-tools.ts>
```

`validate` and `generate` fail on DSL errors (`@core2ai/core/codegen`).

## Database env (DSL)

```text
database postgres env "PAGILA_POSTGRESQL_DATABASE_URL"
database mysql env "SAKILA_MYSQL_DATABASE_URL"
```

The env **name** is in the DSL; the URL lives in `.env` / `mcp.json` `env`.

## Source

- [`src/main.ts`](./src/main.ts) — Commander
- [`src/generator/`](./src/generator/) — codegen
- [`test/`](./test/) — unit tests

---

#Col3:23
