#!/usr/bin/env node
/**
 * Start plants-oracle Docker only (slow; requires one-time registry login).
 *
 * Usage: npm run start:oracle
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runNpm(args) {
    const result = spawnSync('npm', args, { cwd: demosRoot, stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

console.log('[start:oracle] Pulling/starting plants-oracle (may take several minutes).');
console.log('[start:oracle] One-time prerequisite: docker login container-registry.oracle.com (Oracle.com account).');
runNpm(['run', 'db:plants-oracle:up']);
console.log('[start:oracle] plants-oracle is up — enable the plants MCP server in Cursor and reload MCP.');
