#!/usr/bin/env node
/**
 * Start native Open WebUI (pip) for HTTP MCP demo testing.
 * Usage: npm run open-webui
 * Full stack: npm run start:open-webui
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectEnvLocal } from './generated/load-env-local.mjs';
import { buildHostLaunch, HTTP_START_DEMO_NAMES } from './mcp-http-demos.mjs';
import { buildOAuthHostLaunch, OAUTH_HTTP_START_DEMO_NAMES } from './mcp-oauth-demos.mjs';
import { printOpenWebUiMcpHints } from './open-webui-mcp-hints.mjs';
import { probeHttp, runOpenWebUiStart } from './open-webui-launch.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {NodeJS.ProcessEnv} env
 */
function warnIfMcpHostsDown(env) {
    for (const name of HTTP_START_DEMO_NAMES) {
        const { port } = buildHostLaunch(name, demosRoot, env);
        const code = probeHttp(`http://127.0.0.1:${port}/mcp`);
        if (!code) {
            console.warn(`[open-webui] MCP host "${name}" (:${port}) not reachable — run npm run start:all first.`);
        }
    }
    for (const name of OAUTH_HTTP_START_DEMO_NAMES) {
        const { port } = buildOAuthHostLaunch(name, demosRoot, env);
        const code = probeHttp(`http://127.0.0.1:${port}/mcp`);
        if (!code) {
            console.warn(`[open-webui] MCP host "${name}" (:${port}) not reachable — run npm run start:all first.`);
        }
    }
}

loadProjectEnvLocal();
runOpenWebUiStart({ demosRoot, warnIfMcpHostsDown, printOpenWebUiMcpHints });
