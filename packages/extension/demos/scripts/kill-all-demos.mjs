#!/usr/bin/env node
/**
 * Stop MCP HTTP/OAuth hosts, OAuth IDP, and all demo Docker DBs (safe to re-run).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareWorkspaceEnv } from './start-shared.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNode(relativePath, args = []) {
    const result = spawnSync(process.execPath, [path.join(demosRoot, relativePath), ...args], {
        cwd: demosRoot,
        stdio: 'inherit'
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

prepareWorkspaceEnv();
console.log('[kill-all] stopping MCP hosts…');
runNode('./scripts/kill-mcp-hosts.mjs');
console.log('[kill-all] stopping OAuth IDP…');
runNode('./oauth-idp/kill-server.mjs');
console.log('[kill-all] stopping demo Docker databases…');
runNode('./scripts/database/kill-demo-databases.mjs', ['all']);
if (process.env.OPEN_WEBUI_SKIP_KILL === '1') {
    console.log('[kill-all] skipping Open WebUI (OPEN_WEBUI_SKIP_KILL=1).');
} else {
    console.log('[kill-all] stopping Open WebUI…');
    runNode('./scripts/stop-open-webui.mjs');
}
console.log('[kill-all] done.');
