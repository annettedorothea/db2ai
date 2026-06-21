#!/usr/bin/env node
/**
 * Full demo stack: kill-all, all Docker DBs (incl. Oracle), generate, compile, all MCP/IDP hosts.
 * Use for /test-all and release checks. For a single demo use: npm run start:<demo>
 *
 * npm run start:all  (alias: npm run start)
 */
import path from 'node:path';
import { buildHostLaunch, HTTP_START_DEMO_NAMES } from './mcp-http-demos.mjs';
import { buildOAuthHostLaunch, OAUTH_HTTP_START_DEMO_NAMES } from './mcp-oauth-demos.mjs';
import { requireEnvInt } from './generated/require-env.mjs';
import { waitForForegroundServiceShutdown } from './foreground-lifecycle.mjs';
import {
    demosRoot,
    foreground,
    prepareWorkspaceEnv,
    printMcpReminder,
    runNpm,
    serviceChildren,
    startService,
    waitForHttpOk,
    waitForMcpHost
} from './start-shared.mjs';

async function main() {
    prepareWorkspaceEnv();

    console.log('[start:all] stopping previous demo processes…');
    runNpm(['run', 'demo:kill-all']);

    runNpm(['install']);
    console.log('[start:all] starting all demo databases (plants-oracle may take several minutes on first pull)…');
    runNpm(['run', 'db:up:all']);
    runNpm(['run', 'generate:all']);
    runNpm(['run', 'build:generated']);
    if (foreground) {
        console.log('[start:all] foreground mode — LOG_LEVEL=debug for services, logs in this terminal.');
    }

    const idpPort = requireEnvInt('ORDERS_POSTGRESQL_OAUTH_IDP_PORT');
    const idpBaseUrl = `http://127.0.0.1:${idpPort}`;
    startService(
        'oauth-idp',
        [path.join(demosRoot, 'oauth-idp', 'server.mjs')],
        { ORDERS_POSTGRESQL_OAUTH_IDP_PORT: String(idpPort), OAUTH_IDP_SIGN_ALG: 'RS256' },
        idpPort
    );

    console.log(`[start:all] waiting for oauth-idp at ${idpBaseUrl}…`);
    await waitForHttpOk(`${idpBaseUrl}/.well-known/openid-configuration`, {
        label: 'oauth-idp openid-configuration'
    });

    for (const name of HTTP_START_DEMO_NAMES) {
        const { port, args, mcpUrl } = buildHostLaunch(name, demosRoot, process.env);
        const label = `mcp-http:${name} (${mcpUrl})`;
        startService(label, args);
        await waitForMcpHost(label, port, mcpUrl);
    }

    for (const name of OAUTH_HTTP_START_DEMO_NAMES) {
        const { port, args, mcpUrl } = buildOAuthHostLaunch(name, demosRoot, process.env);
        const label = `mcp-oauth:${name} (${mcpUrl})`;
        startService(label, args);
        await waitForMcpHost(label, port, mcpUrl);
    }

    if (foreground) {
        printMcpReminder();
        console.log('[start:all] Ctrl+C stops MCP/IDP processes started here (npm run demo:kill-all also stops Docker).');
        await waitForForegroundServiceShutdown({ label: 'start:all', serviceChildren, demosRoot });
        return;
    }
    console.log('[start:all] done. Demo services run in background (npm run demo:kill-all stops MCP, IDP, and Docker).');
    printMcpReminder();
    console.log('[start:all] live logs: START_FOREGROUND=1 npm run start:all');
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[start:all] failed:', message);
    process.exit(1);
});
