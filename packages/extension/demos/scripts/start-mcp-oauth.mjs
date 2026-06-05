#!/usr/bin/env node
/**
 * Start one oauth-http MCP host (foreground).
 * Usage: node scripts/start-mcp-oauth.mjs <orders-demo>
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDemoEnvLocal } from './load-env-local.mjs';
import { buildOAuthHostLaunch, OAUTH_HTTP_DEMOS, OAUTH_HTTP_DEMO_NAMES } from './mcp-oauth-demos.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
    const name = process.argv[2];
    if (!name || !OAUTH_HTTP_DEMOS[name]) {
        console.error(`Usage: node scripts/start-mcp-oauth.mjs <${OAUTH_HTTP_DEMO_NAMES.join('|')}>`);
        process.exit(1);
    }

    loadDemoEnvLocal();
    const { demo, port, args, mcpUrl, tokenValidation } = buildOAuthHostLaunch(name, demosRoot, process.env);

    console.error(`[mcp-oauth:${name}] listening http://127.0.0.1:${port}/mcp`);
    console.error(`[mcp-oauth:${name}] Cursor mcp.json: ${demo.mcpServerName ?? `${name}-oauth`}`);
    console.error(`[mcp-oauth:${name}] auth.CLIENT_ID: mcp-demo-local`);
    console.error(`[mcp-oauth:${name}] oauth-token-validation: ${tokenValidation}`);
    if (demo.prerequisite) {
        console.error(`[mcp-oauth:${name}] prerequisite: ${demo.prerequisite}`);
    }

    const result = spawnSync(process.execPath, args, {
        cwd: demosRoot,
        stdio: 'inherit',
        env: process.env
    });
    process.exit(result.status ?? 1);
}

main();
