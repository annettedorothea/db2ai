#!/usr/bin/env bash
# Validates prerequisites when the user triggers the db2ai MCP smoke-test shortcut.
set -euo pipefail

input=$(cat)
prompt=$(printf '%s' "$input" | python3 -c "import json,sys; print(json.load(sys.stdin).get('prompt',''))")
trimmed=$(printf '%s' "$prompt" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')

allow() {
    printf '%s\n' '{"continue": true}'
    exit 0
}

deny() {
    python3 -c 'import json,sys; print(json.dumps({"continue": False, "user_message": sys.argv[1]}))' "$1"
    exit 0
}

# Not a test-all trigger — pass through.
if ! printf '%s' "$trimmed" | grep -qiE '^(db2ai[[:space:]]+)?/?test(-all|:all)$'; then
    allow
fi

if [[ ! -f .cursor/mcp.json ]]; then
    deny "test-all: .cursor/mcp.json fehlt. Workspace-Root oeffnen (packages/extension/demos)."
fi

if [[ ! -f .cursor/skills/db2ai-test-all-mcp/SKILL.md ]]; then
    deny "test-all: Skill .cursor/skills/db2ai-test-all-mcp/SKILL.md fehlt."
fi

if ! command -v node >/dev/null 2>&1; then
    deny "test-all: node nicht im PATH (fuer npm run start:all noetig)."
fi

if ! node scripts/check-mcp-ready.mjs >&2; then
    deny "test-all: HTTP-MCP-Ports nicht erreichbar. npm run start:mcp (DBs/IdP laufen?) oder npm run start:all."
fi

allow
