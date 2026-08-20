# db2ai

Language support and code generation for the `.db2ai` DSL.

The extension provides:

- Syntax highlighting
- Validation
- Schema-aware completion
- Generate on save
- MCP host generation

`db2ai` generates curated MCP tools from relational databases.

---

## Requirements

- VS Code or Cursor **1.67+**
- Node.js **20+**
- Docker Desktop for the demo workspace

---

## Quick Start

### 1. Create a demo workspace

Open the Command Palette and run:

```text
db2ai: Create demo workspace (MCP examples)
```

Choose an empty folder and open it when prompted.

### 2. Open the demo README

The generated workspace contains its own `README.md` with a guided walkthrough and several example projects.

---

## Working with your own databases

Open a folder containing `.db2ai` files.

Whenever you save a file, the extension generates tool code and MCP hosts automatically.

Generated files are written to:

```text
generated/db2ai/
```

Put database URLs and secrets in the workspace `.env` (the env name from your `database … env "…"` line). Configure Cursor MCP in `.cursor/mcp.json`: **stdio** entries typically use `envFile` pointing at that `.env`; **HTTP** entries point at a running host URL (credentials stay with the host / `.env`, not in `mcp.json`).

Details: [Cursor integration](https://github.com/annettedorothea/core2ai/blob/main/docs/integrations/cursor.md).

You can also trigger generation manually:

```text
db2ai: Generate tool code (.ts + MCP host)
```

---

## Documentation

[Documentation index](https://github.com/annettedorothea/core2ai/blob/main/docs/README.md) — architecture, authoring, runtime, and integrations.

---

## Related Projects

- https://github.com/annettedorothea/core2ai
- https://github.com/annettedorothea/api2ai

---

## Feedback

Share onboarding and integration feedback in [GitHub Discussions](https://github.com/annettedorothea/db2ai/discussions/1). For bugs, open an [Issue](https://github.com/annettedorothea/db2ai/issues).

---

## License

MIT — see `LICENSE`.

---

> _Whatever you do, work heartily, as for the Lord and not for men._
>
> **— Colossians 3:23**
>
> _Created by Annette Pohl_
