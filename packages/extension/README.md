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

Database credentials and runtime configuration belong in:

```text
.cursor/mcp.json
```

You can also trigger generation manually:

```text
db2ai: Generate tool code (.ts + MCP host)
```

---

## Documentation

Looking for architecture, authentication, MCP concepts, integrations, or development guides?

See the shared documentation in:

https://github.com/annettedorothea/core2ai

---

## Related Projects

- https://github.com/annettedorothea/core2ai
- https://github.com/annettedorothea/api2ai

---

## License

MIT — see `LICENSE`.

---

> _Whatever you do, work heartily, as for the Lord and not for men._
>
> **— Colossians 3:23**
>
> _Created by Annette Pohl_
