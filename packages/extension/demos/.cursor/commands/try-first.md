# Try first MCP server (sakila-mysql)

Read **`README.md`** in this workspace (section **Quick start**) and help the user complete it.

Prerequisites: Docker Desktop running.

If setup is not done yet, run in the demo workspace root:

```bash
npm run mcp:inspect -- sakila-mysql
```

Then ensure only the **`sakila-mysql`** MCP server is enabled in Cursor and MCP is reloaded.

Finally, answer this using the sakila-mysql tool (schema-only tool call, no guessing):

```text
db2ai List five films from the Sakila database.
```

Report which MCP server and tool you used.
