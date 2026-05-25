# db-2-ai-dsl-language

Langium package for the **`.db2ai` DSL** (grammar, PostgreSQL schema validation, completion).

## Key files

- [`src/db-2-ai-dsl.langium`](./src/db-2-ai-dsl.langium) — grammar
- [`src/db-2-ai-dsl-validator.ts`](./src/db-2-ai-dsl-validator.ts) — document validation
- [`src/db-2-ai-dsl-sql-validator.ts`](./src/db-2-ai-dsl-sql-validator.ts) — SQL block validation
- [`src/db-2-ai-dsl-completion-provider.ts`](./src/db-2-ai-dsl-completion-provider.ts) — completion (tables, columns)
- [`src/schema.ts`](./src/schema.ts) — PostgreSQL introspection
- [`syntaxes/db-2-ai-dsl.tmLanguage.json`](./syntaxes/db-2-ai-dsl.tmLanguage.json) — TextMate grammar (generated)
- [`test/`](./test/) — parsing, validation, SQL tests

Monorepo overview: [`../../README.md`](../../README.md).

---

_Created with gratitude to Jesus Christ._
