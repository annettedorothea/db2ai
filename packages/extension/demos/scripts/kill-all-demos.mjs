#!/usr/bin/env node
/**
 * Stop fixtures and MCP hosts (safe to re-run).
 */
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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
console.log('[kill-all] stopping fixtures…');
runNode('./scripts/kill-fixtures.mjs');
console.log('[kill-all] stopping demo Docker databases…');
runNode('./scripts/database/kill-demo-databases.mjs', ['all']);
console.log('[kill-all] done.');
