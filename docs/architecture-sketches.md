# Architecture sketches

## DSL v1

```text
database "postgresql://..."
SELECT * FROM <table> {
    toolName: "..."
    intent: "..."
    example: "..."   // optional
    summary: "..."   // optional
}
```

- **Validator** connects via `pg`, reads `information_schema.tables` (`public`), checks table names and block metadata (like api2ai + OpenAPI).
- **Completion** after `FROM` suggests known tables from the same schema load.
- **Codegen / MCP** — not in v1.
