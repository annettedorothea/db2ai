#!/usr/bin/env node
/**
 * Open MCP Inspector for a demo HTTP host that is already running.
 *
 * Standard manual verify for generated HTTP MCP tools (alongside /test-all in Cursor).
 *
 * Prerequisite: `npm run start:all` (or `npm run start:mcp` with databases/IdP already up).
 *
 * Usage:
 *   npm run mcp:inspect -- <demo-name>
 *
 * Example:
 *   npm run mcp:inspect -- orders-postgresql
 */
import path from 'node:path';
import { DEMO_LAUNCH_NAMES, DEMO_LAUNCH_REGISTRY } from './demo-launch-registry.mjs';
import { HTTP_DEMOS } from './mcp-http-demos.mjs';
import { buildOAuthHostLaunch, OAUTH_HTTP_DEMOS } from './mcp-oauth-demos.mjs';
import { demosRoot, prepareWorkspaceEnv } from './start-shared.mjs';
import {
    AUTH_BANNER,
    printAuthHeader,
    printOAuthBlock,
    runMcpInspect
} from '../generated/db2ai/scripts/mcp-inspect-lib.mjs';

/**
 * @param {string} demoName
 * @param {NodeJS.ProcessEnv} env
 */
function printMcpInspectAuthHints(demoName, env = process.env) {
    console.log('');
    console.log(AUTH_BANNER);
    console.log(`  Demo: ${demoName}`);
    console.log('');

    const httpDemo = HTTP_DEMOS[demoName];
    const oauthDemo = OAUTH_HTTP_DEMOS[demoName];

    if (httpDemo && !httpDemo.authExpectedEnv) {
        console.log('  Authentication: none (public HTTP host).');
        console.log('');
        return;
    }

    if (httpDemo?.authExpectedEnv) {
        const headerName = env.MCP_AUTH_HEADER?.trim() || 'x-api-token';
        const headerValue = env.MCP_AUTH_EXPECTED?.trim() || 'demo';
        printAuthHeader(headerName, headerValue);
        console.log('  Must match MCP_AUTH_EXPECTED in .env.');
        console.log('');
        return;
    }

    if (demoName === 'orders-postgresql') {
        const oauthServerUrl = env.ORDERS_POSTGRESQL_OAUTH_IDP_URL?.trim() || 'http://127.0.0.1:4863';
        const { mcpUrl } = buildOAuthHostLaunch(demoName, demosRoot, env);
        printOAuthBlock({
            mcpUrl,
            oauthServerUrl,
            scope: oauthDemo?.oauthScope ?? 'orders-postgresql',
            bearerHint: `Run: node ${path.join(demosRoot, 'orders-postgresql/get-token.mjs')} alice`
        });
        return;
    }

    console.log('  See .cursor/mcp.json and core2ai/docs/testing/mcp-inspector.md');
    console.log('');
}

runMcpInspect({
    demosRoot,
    demoNames: DEMO_LAUNCH_NAMES,
    isKnownDemo: (name) => Boolean(DEMO_LAUNCH_REGISTRY[name]),
    prepareEnv: prepareWorkspaceEnv,
    printAuthHints: printMcpInspectAuthHints
}).catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mcp:inspect] failed:', message);
    process.exit(1);
});
