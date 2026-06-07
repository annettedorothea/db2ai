#!/usr/bin/env node
/**
 * Stop MCP HTTP/OAuth hosts, OAuth IDP, and all demo Docker DBs (safe to re-run).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDemoEnvLocal } from './load-env-local.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNpmScript(name) {
    const result = spawnSync('npm', ['run', name], {
        cwd: demosRoot,
        stdio: 'inherit',
        shell: process.platform === 'win32'
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

loadDemoEnvLocal();
console.log('[kill-all] stopping MCP OAuth hosts…');
runNpmScript('demo:mcp-oauth:kill');
console.log('[kill-all] stopping MCP HTTP hosts…');
runNpmScript('demo:mcp-http:kill');
console.log('[kill-all] stopping OAuth IDP…');
runNpmScript('demo:oauth-idp:kill');
console.log('[kill-all] stopping demo Docker databases…');
runNpmScript('db:kill:all');
console.log('[kill-all] done.');
