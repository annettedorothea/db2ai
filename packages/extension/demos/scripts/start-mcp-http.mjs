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
    const { demo, port, args, mcpUrl } = buildHostLaunch(name, demosRoot, process.env);
    const authHeader = process.env.MCP_AUTH_HEADER?.trim() || 'x-api-token';

    console.error(`[mcp-http:${name}] listening http://127.0.0.1:${port}/mcp`);
    console.error(`[mcp-http:${name}] Cursor mcp.json url: ${mcpUrl}`);
    console.error(`[mcp-http:${name}] credential header name (server): ${authHeader}`);
    if (demo.prerequisite) {
        console.error(`[mcp-http:${name}] prerequisite: ${demo.prerequisite}`);
    }
    if (name === 'pagila') {
        console.error(
            `[mcp-http:${name}] protected tools: set headers.${authHeader} in mcp.json (demo: "demo") or DB2AI_AUTH_TOKEN in .env for stdio.`
        );
    }

    const result = spawnSync(process.execPath, args, {
        cwd: demosRoot,
        stdio: 'inherit',
        env: process.env
    });
    process.exit(result.status ?? 1);
}

main();
