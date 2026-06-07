#!/usr/bin/env node
/**
 * SQL Server demo only: env, Docker (animals-sqlserver), schema, generate one DSL, compile.
 * Optional foreground stdio MCP host for manual smoke tests (Cursor normally starts stdio via mcp.json).
 */
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadDemoEnvLocal } from './load-env-local.mjs';
import { buildStdioHostLaunch } from './mcp-stdio-demos.mjs';
import { waitForForegroundServiceShutdown } from './foreground-lifecycle.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const foreground =
    process.env.START_FOREGROUND === '1' ||
    process.env.START_FOREGROUND === 'true' ||
    process.env.START_FOREGROUND === 'yes';
const STDIO_DEMO_NAME = 'animals-sqlserver';

/** @type {import('node:child_process').ChildProcess[]} */
const serviceChildren = [];

function runNpm(args) {
    const result = spawnSync('npm', args, { cwd: demosRoot, stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function ensureEnvFromExample() {
    const examplePath = path.join(demosRoot, '.env.example');
    const targetPath = path.join(demosRoot, '.env');
    if (existsSync(targetPath)) {
        console.log('[start:mssql] .env already exists — not overwritten.');
        return false;
    }
    if (!existsSync(examplePath)) {
        console.warn('[start:mssql] .env.example missing — skip env copy.');
        return false;
    }
    copyFileSync(examplePath, targetPath);
    console.log('[start:mssql] Created .env from .env.example');
    return true;
}

async function main() {
    console.log('[start:mssql] clearing previous SQL Server demo container…');
    runNpm(['run', 'db:kill:mssql']);

    console.log('[start:mssql] SQL Server animals demo — no Pagila/Sakila/orders containers.');
    loadDemoEnvLocal();
    if (ensureEnvFromExample()) {
        loadDemoEnvLocal();
    }

    runNpm(['install']);
    runNpm(['run', 'db:animals-sqlserver:up']);
    runNpm(['run', 'generate:animals-sqlserver']);
    runNpm(['run', 'build:generated']);

    if (!foreground) {
        console.log('[start:mssql] Done. Enable MCP server `animals-sqlserver` in Cursor and reload MCP.');
        console.log('[start:mssql] Foreground stdio smoke test: npm run start:mssql:foreground');
        return;
    }

    const env = { ...process.env, LOG_SERVICE_PREFIX: 'mcp-stdio:animals-sqlserver', LOG_LEVEL: 'debug' };
    const { args } = buildStdioHostLaunch(STDIO_DEMO_NAME, demosRoot, env);
    console.log('[start:mssql] Starting stdio MCP host in foreground (Ctrl+C stops MCP host)…');
    const child = spawn(process.execPath, args, { cwd: demosRoot, stdio: 'inherit', env });
    serviceChildren.push(child);
    await waitForForegroundServiceShutdown({
        label: 'start:mssql',
        serviceChildren,
        demosRoot
    });
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[start:mssql] failed:', message);
    process.exit(1);
});
