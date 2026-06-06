#!/usr/bin/env node
/**
 * Start one stateless HTTP MCP host (foreground).
 * Usage: node scripts/start-mcp-http.mjs <pagila>
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDemoEnvLocal } from './load-env-local.mjs';
import { buildHostLaunch, HTTP_DEMOS, HTTP_DEMO_NAMES } from './mcp-http-demos.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function main() {
    const name = process.argv[2];
    if (!name || !HTTP_DEMOS[name]) {
        console.error(`Usage: node scripts/start-mcp-http.mjs <${HTTP_DEMO_NAMES.join('|')}>`);
        console.error('All hosts (background): npm run demo:mcp-http:all');
        process.exit(1);
    }

    loadDemoEnvLocal();
    process.env.LOG_SERVICE_PREFIX = process.env.LOG_SERVICE_PREFIX ?? `mcp-http:${name}`;
    const { demo, port, args, mcpUrl, credentialValidation } = buildHostLaunch(name, demosRoot, process.env);
    const authHeader = process.env.MCP_AUTH_HEADER?.trim() || 'x-api-token';

    console.log(
        `[mcp-http:${name}] listening http://127.0.0.1:${port}/mcp (${mcpUrl}, ${authHeader}, ${credentialValidation}${demo.prerequisite ? `, ${demo.prerequisite}` : ''})`
    );

    const result = spawnSync(process.execPath, args, {
        cwd: demosRoot,
        stdio: 'inherit',
        env: process.env
    });
    process.exit(result.status ?? 1);
}

main();
