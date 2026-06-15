# db2ai

Language support and code generation for the **`.db2ai` DSL** (SQL → MCP tools): syntax highlighting, validation, schema-aware completion, and generate on save.

## Requirements

- VS Code or Cursor **1.67+**
- Node.js **20+** in the demo workspace
- **Docker Desktop** (running) for demo databases

## Create demo workspace

**Goal:** set up a local folder with example `.db2ai` files, Docker DB config, and MCP config.

1. Command Palette → **`db2ai: Create demo workspace (MCP examples)`**
2. Choose an **empty folder** (or confirm overwrite if retrying)
3. Click **Open folder** when prompted

**Next:** open **`README.md`** in that demo folder — it walks you through testing your first MCP server.

## Your own `.db2ai` projects

Open any folder with `.db2ai` files. On **save**, the extension generates tool modules and MCP hosts (run **`npm install`** once). Set `database env "YOUR_VAR"` in the DSL; put the connection URL in `.env` / MCP config.

Command Palette: **Generate tool code (.ts + MCP host)** for manual generation of the focused file.

Supported dialects: PostgreSQL, MySQL, MariaDB, SQL Server, Oracle.

## License

BUSL-1.1 — Copyright (c) 2026 Annette Pohl. Full license text is in the VSIX (`LICENSE`).

---

#Col3:23
