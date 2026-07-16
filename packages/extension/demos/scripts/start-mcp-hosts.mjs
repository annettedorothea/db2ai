import { demosRoot, startService, waitForMcpHost } from './start-shared.mjs';

export async function loadStartModules() {
    const [
        { buildHostLaunch, HTTP_START_DEMO_NAMES },
        { buildOAuthHostLaunch, OAUTH_HTTP_START_DEMO_NAMES },
        { buildHttpMcpCatalogEntries, buildOAuthMcpCatalogEntries },
        { printStartMcpSummary }
    ] = await Promise.all([
        import('./mcp-http-demos.mjs'),
        import('./mcp-oauth-demos.mjs'),
        import('./mcp-catalog-entries.mjs'),
        import('../generated/db2ai/scripts/print-mcp-catalog.mjs')
    ]);
    return {
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
 * @param {string} logTag
 * @param {Awaited<ReturnType<typeof loadStartModules>>} modules
 * @param {Map<string, { status: 'running' | 'skipped', skipReason?: string }>} httpStatus
 * @param {Map<string, { status: 'running' | 'skipped', skipReason?: string }>} oauthStatus
 */
export function printMcpCatalogSummary(logTag, modules, httpStatus, oauthStatus) {
    const {
        HTTP_START_DEMO_NAMES,
        OAUTH_HTTP_START_DEMO_NAMES,
        buildHttpMcpCatalogEntries,
        buildOAuthMcpCatalogEntries,
        printStartMcpSummary
    } = modules;
    printStartMcpSummary({
        logPrefix: `[${logTag}]`,
        title: 'Demo MCP hosts',
        httpEntries: buildHttpMcpCatalogEntries(HTTP_START_DEMO_NAMES, process.env, httpStatus),
        oauthEntries: buildOAuthMcpCatalogEntries(OAUTH_HTTP_START_DEMO_NAMES, process.env, oauthStatus),
        compactRunningUrls: false,
        footerLines: [
            'Cursor: Settings → Tools & MCPs — enable servers, reload MCP.',
            'HTTP debug: npm run mcp:inspect -- <demo>',
            'Stop MCP: npm run demo:kill-mcp · Stop all: npm run demo:kill-all'
        ]
    });
}

/**
 * @param {string} logTag
 */
export async function startMcpHosts(logTag) {
    const modules = await loadStartModules();
    const { buildHostLaunch, HTTP_START_DEMO_NAMES, buildOAuthHostLaunch, OAUTH_HTTP_START_DEMO_NAMES } = modules;

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
            console.warn(`[${logTag}] ${labelBase} skipped: ${message}`);
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
            console.warn(`[${logTag}] ${labelBase} skipped: ${message}`);
            oauthStatus.set(name, { status: 'skipped', skipReason: message });
        }
    }

    printMcpCatalogSummary(logTag, modules, httpStatus, oauthStatus);
    return { modules, httpStatus, oauthStatus };
}
