# db-2-ai-dsl-language

Langium package for `.db2ai` files.

- Grammar: `database` + `SELECT * FROM <table>` blocks with MCP metadata (`toolName`, `intent`, …).
- Validation: PostgreSQL schema introspection (`schema.ts`, `pg`).
- Completion: table names after `FROM`.
