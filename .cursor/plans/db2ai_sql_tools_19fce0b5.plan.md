
---
name: db2ai SQL tools
overview: "Umgesetzt: SQL { query, params } neben SELECT * FROM; Validierung nur $n↔params; kein exampleParams/DB-Execute."
todos:
  - id: grammar-sql-query
    content: "Langium: ModelEntry TableQuery|SqlQuery, PARAM_REF, params; kein exampleParams; AST-Migration"
    status: completed
  - id: sql-validator
    content: "Sql-Validator: nur $n in query ↔ params (inkl. Duplikate); kein DB-Execute"
    status: completed
  - id: completion-sql-block
    content: "Completion: SQL_BLOCK_KEYS ohne exampleParams; keine Vorschläge in query-STRING"
    status: completed
  - id: codegen-sql-tools
    content: resolveSqlTools, inputSchema aus params (string), generator invoke + mcp-server generic args
    status: completed
  - id: examples-sql-readme
    content: pagila.db2ai SQL-Beispiel, README, Tests, build/smoke mit CLI-Args
    status: completed
isProject: false
---

# Plan: Plain-SQL-Tools — umgesetzt

Siehe Implementierung in db2ai (Grammar `SqlQuery`, Validator, Codegen, `pagila.db2ai` Beispiel `filmsByRating`).
