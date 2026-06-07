#!/usr/bin/env node
/**
 * Oracle plants demo only: env, Docker (plants-oracle), schema, generate one DSL, compile.
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
const STDIO_DEMO_NAME = 'plants-oracle';

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
        console.log('[start:oracle] .env already exists — not overwritten.');
        return false;
    }
    if (!existsSync(examplePath)) {
        console.warn('[start:oracle] .env.example missing — skip env copy.');
        return false;
    }
    copyFileSync(examplePath, targetPath);
    console.log('[start:oracle] Created .env from .env.example');
    return true;
}

async function main() {
    console.log('[start:oracle] clearing previous Oracle demo container…');
    runNpm(['run', 'db:kill:oracle']);

    console.log('[start:oracle] Oracle plants demo — no Pagila/Sakila/orders containers.');
    loadDemoEnvLocal();
    if (ensureEnvFromExample()) {
        loadDemoEnvLocal();
    }

    runNpm(['install']);
    runNpm(['run', 'db:plants-oracle:up']);
    runNpm(['run', 'generate:plants-oracle']);
    runNpm(['run', 'build:generated']);

    if (!foreground) {
        console.log('[start:oracle] Done. Enable MCP server `plants` in Cursor and reload MCP.');
        console.log('[start:oracle] Foreground stdio smoke test: npm run start:oracle:foreground');
        return;
    }

    const env = { ...process.env, LOG_SERVICE_PREFIX: 'mcp-stdio:plants-oracle', LOG_LEVEL: 'debug' };
    const { args } = buildStdioHostLaunch(STDIO_DEMO_NAME, demosRoot, env);
    console.log('[start:oracle] Starting stdio MCP host in foreground (Ctrl+C stops MCP host)…');
    const child = spawn(process.execPath, args, { cwd: demosRoot, stdio: 'inherit', env });
    serviceChildren.push(child);
    await waitForForegroundServiceShutdown({
        label: 'start:oracle',
        serviceChildren,
        demosRoot
    });
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[start:oracle] failed:', message);
    process.exit(1);
});
