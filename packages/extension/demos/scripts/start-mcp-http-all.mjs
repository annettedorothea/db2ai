#!/usr/bin/env node
/**
 * Start db2ai stateless HTTP MCP hosts used by init / mcp.json (pagila).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDemoEnvLocal } from './load-env-local.mjs';
import { buildHostLaunch, HTTP_INIT_DEMO_NAMES } from './mcp-http-demos.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function startDetached(name, args, port, mcpUrl) {
    const child = spawn(process.execPath, args, {
        cwd: demosRoot,
        detached: true,
        stdio: 'ignore',
        env: process.env
    });
    child.unref();
    console.log(`[mcp-http:all] ${name} → http://127.0.0.1:${port}/mcp (${mcpUrl}) pid ${child.pid ?? '?'}`);
}

function main() {
    loadDemoEnvLocal();

    for (const name of HTTP_INIT_DEMO_NAMES) {
        const { port, args, mcpUrl } = buildHostLaunch(name, demosRoot, process.env);
        startDetached(name, args, port, mcpUrl);
    }

    console.log('[mcp-http:all] Started', HTTP_INIT_DEMO_NAMES.length, 'hosts. Stop: npm run demo:mcp-http:kill');
    console.warn('[mcp-http:all] Requires Pagila up (npm run db:pagila:up or init).');
}

main();
