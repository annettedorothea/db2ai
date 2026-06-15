#!/usr/bin/env node
/**
 * Start one oauth-http MCP host (foreground).
 * Usage: node scripts/start-mcp-oauth.mjs <orders>
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectEnvLocal } from './generated/load-env-local.mjs';
import { buildOAuthHostLaunch, OAUTH_HTTP_DEMOS, OAUTH_HTTP_DEMO_NAMES } from './mcp-oauth-demos.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
    const name = process.argv[2];
    if (!name || !OAUTH_HTTP_DEMOS[name]) {
        console.error(`Usage: node scripts/start-mcp-oauth.mjs <${OAUTH_HTTP_DEMO_NAMES.join('|')}>`);
        process.exit(1);
    }

    loadProjectEnvLocal();
    process.env.LOG_SERVICE_PREFIX = process.env.LOG_SERVICE_PREFIX ?? `mcp-oauth:${name}`;
    const { demo, port, args, mcpUrl } = buildOAuthHostLaunch(name, demosRoot, process.env);

    console.log(
        `[mcp-oauth:${name}] listening http://127.0.0.1:${port}/mcp (${mcpUrl}${demo.prerequisite ? `, ${demo.prerequisite}` : ''})`
    );

    const result = spawnSync(process.execPath, args, {
        cwd: demosRoot,
        stdio: 'inherit',
        env: process.env
    });
    process.exit(result.status ?? 1);
}

main();
