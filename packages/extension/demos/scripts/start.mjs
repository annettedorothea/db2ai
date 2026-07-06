#!/usr/bin/env node
/**
 * Full demo stack: kill-all, all Docker DBs (incl. Oracle), generate, compile, all MCP/IDP hosts.
 * Use for /test-all and release checks. For a single demo use: npm run start:<demo>
 *
 * npm run start:all  (alias: npm run start) — foreground, banners in this terminal
 * npm run start:background — detached, terminal free after setup
 */
import path from 'node:path';
import { waitForForegroundServiceShutdown } from './foreground-lifecycle.mjs';
import {
    demosRoot,
    foreground,
    prepareWorkspaceEnv,
    runNpm,
    serviceChildren,
    startService,
    waitForHttpOk,
    waitForMcpHost
} from './start-shared.mjs';

async function loadStartModules() {
    const [
        { requireEnvInt },
        { buildHostLaunch, HTTP_START_DEMO_NAMES },
        { buildOAuthHostLaunch, OAUTH_HTTP_START_DEMO_NAMES },
        { buildHttpMcpCatalogEntries, buildOAuthMcpCatalogEntries },
        { printStartMcpSummary }
    ] = await Promise.all([
        import('./generated/require-env.mjs'),
        import('./mcp-http-demos.mjs'),
        import('./mcp-oauth-demos.mjs'),
        import('./mcp-catalog-entries.mjs'),
        import('./generated/print-mcp-catalog.mjs')
    ]);
    return {
        requireEnvInt,
        buildHostLaunch,
        HTTP_START_DEMO_NAMES,
        buildOAuthHostLaunch,
        OAUTH_HTTP_START_DEMO_NAMES,
        buildHttpMcpCatalogEntries,
        buildOAuthMcpCatalogEntries,
        printStartMcpSummary
    };
}

/**
 * @param {Map<string, { status: 'running' | 'skipped', skipReason?: string }>} httpStatus
 * @param {Map<string, { status: 'running' | 'skipped', skipReason?: string }>} oauthStatus
 * @param {Awaited<ReturnType<typeof loadStartModules>>} modules
 */
function printStartMcpSummaryFromStatus(httpStatus, oauthStatus, modules) {
    const {
        HTTP_START_DEMO_NAMES,
        OAUTH_HTTP_START_DEMO_NAMES,
        buildHttpMcpCatalogEntries,
        buildOAuthMcpCatalogEntries,
        printStartMcpSummary
    } = modules;
    printStartMcpSummary({
        logPrefix: '[start:all]',
        title: 'Demo MCP hosts',
        httpEntries: buildHttpMcpCatalogEntries(HTTP_START_DEMO_NAMES, process.env, httpStatus),
        oauthEntries: buildOAuthMcpCatalogEntries(OAUTH_HTTP_START_DEMO_NAMES, process.env, oauthStatus),
        compactRunningUrls: !foreground,
        footerLines: [
            'Cursor: Settings → Tools & MCPs — enable servers, reload MCP.',
            'HTTP debug: npm run mcp:inspect -- <demo>',
            'Stop: npm run demo:kill-all (MCP, IDP, Docker)',
            foreground ? 'Detached mode: npm run start:background' : 'Live banners: npm run start:all'
        ]
    });
}

async function main() {
    prepareWorkspaceEnv();

    console.log('[start:all] stopping previous demo processes…');
    runNpm(['run', 'demo:kill-all']);

    runNpm(['install']);
    console.log('[start:all] starting all demo databases (plants-oracle may take several minutes on first pull)…');
    runNpm(['run', 'db:up:all']);
    runNpm(['run', 'generate:all']);
    runNpm(['run', 'build:generated']);
    const modules = await loadStartModules();
    const { requireEnvInt, buildHostLaunch, HTTP_START_DEMO_NAMES, buildOAuthHostLaunch, OAUTH_HTTP_START_DEMO_NAMES } =
        modules;
    if (foreground) {
        console.log('[start:all] foreground — LOG_LEVEL=debug, MCP banners in this terminal.');
    } else {
        console.log('[start:all] background — services detached; use npm run start:all for live banners.');
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

    /** @type {Map<string, { status: 'running' | 'skipped', skipReason?: string }>} */
    const httpStatus = new Map();
    for (const name of HTTP_START_DEMO_NAMES) {
        const labelBase = `mcp-http:${name}`;
        try {
            const { port, args, mcpUrl } = buildHostLaunch(name, demosRoot, process.env);
            const label = `${labelBase} (${mcpUrl})`;
            startService(label, args);
            await waitForMcpHost(label, port, mcpUrl);
            httpStatus.set(name, { status: 'running' });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[start:all] ${labelBase} skipped: ${message}`);
            httpStatus.set(name, { status: 'skipped', skipReason: message });
        }
    }

    /** @type {Map<string, { status: 'running' | 'skipped', skipReason?: string }>} */
    const oauthStatus = new Map();
    for (const name of OAUTH_HTTP_START_DEMO_NAMES) {
        const labelBase = `mcp-oauth:${name}`;
        try {
            const { port, args, mcpUrl } = buildOAuthHostLaunch(name, demosRoot, process.env);
            const label = `${labelBase} (${mcpUrl})`;
            startService(label, args);
            await waitForMcpHost(label, port, mcpUrl);
            oauthStatus.set(name, { status: 'running' });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[start:all] ${labelBase} skipped: ${message}`);
            oauthStatus.set(name, { status: 'skipped', skipReason: message });
        }
    }

    printStartMcpSummaryFromStatus(httpStatus, oauthStatus, modules);

    if (foreground) {
        console.log('[start:all] Ctrl+C stops MCP/IDP processes started here (npm run demo:kill-all also stops Docker).');
        await waitForForegroundServiceShutdown({ label: 'start:all', serviceChildren, demosRoot });
        return;
    }
    console.log('[start:all] done. Demo services run in background.');
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[start:all] failed:', message);
    process.exit(1);
});
