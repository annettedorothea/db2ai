#!/usr/bin/env node
/**
 * Start one db2ai demo: DB (+ MCP HTTP/OAuth host when needed), without killing other demos.
 *
 * Usage: node ./scripts/start-demo.mjs <sakila-mysql|pagila-postgresql|orders-postgresql|animals-sqlserver|plants-oracle>
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { DEMO_LAUNCH_NAMES, DEMO_LAUNCH_REGISTRY } from './demo-launch-registry.mjs';
import { buildHostLaunch } from './mcp-http-demos.mjs';
import { buildOAuthHostLaunch } from './mcp-oauth-demos.mjs';
import { killListenersOnPort } from './generated/kill-listeners-on-port.mjs';
import { requireEnvInt } from './generated/require-env.mjs';
import {
    demosRoot,
    foreground,
    prepareWorkspaceEnv,
    printMcpReminder,
    runNpm,
    generateAndCompile,
    serviceChildren,
    startService,
    waitForHttpOk,
    waitForMcpHost
} from './start-shared.mjs';
import { waitForForegroundServiceShutdown } from './foreground-lifecycle.mjs';

const demoName = process.argv[2]?.trim();
const spec = demoName ? DEMO_LAUNCH_REGISTRY[demoName] : undefined;

if (!spec) {
    console.error(`[start:${demoName ?? '?'}] unknown demo — use: ${DEMO_LAUNCH_NAMES.join(', ')}`);
    process.exit(1);
}

function runDbUp() {
    const result = spawnSync(process.execPath, [path.join(demosRoot, 'scripts/database/db-up-one.mjs'), demoName], {
        cwd: demosRoot,
        stdio: 'inherit',
        env: process.env
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function killPortsForDemo() {
    if (spec.mcpMode === 'http' && spec.httpDemo) {
        const { port } = buildHostLaunch(spec.httpDemo, demosRoot, process.env);
        killListenersOnPort(port, { logPrefix: `mcp-http:${spec.httpDemo}:kill` });
    }
    if (spec.mcpMode === 'oauth' && spec.oauthDemo) {
        const { port } = buildOAuthHostLaunch(spec.oauthDemo, demosRoot, process.env);
        killListenersOnPort(port, { logPrefix: `mcp-oauth:${spec.oauthDemo}:kill` });
    }
    if (spec.oauthIdp) {
        const idpPort = requireEnvInt('ORDERS_POSTGRESQL_OAUTH_IDP_PORT');
        killListenersOnPort(idpPort, { logPrefix: 'oauth-idp:kill' });
    }
}

async function startMcpHosts() {
    if (spec.oauthIdp) {
        const idpPort = requireEnvInt('ORDERS_POSTGRESQL_OAUTH_IDP_PORT');
        const idpBaseUrl = `http://127.0.0.1:${idpPort}`;
        startService(
            'oauth-idp',
            [path.join(demosRoot, 'oauth-idp', 'server.mjs')],
            { ORDERS_POSTGRESQL_OAUTH_IDP_PORT: String(idpPort), OAUTH_IDP_SIGN_ALG: 'RS256' },
            idpPort
        );
        console.log(`[start:${demoName}] waiting for oauth-idp at ${idpBaseUrl}…`);
        await waitForHttpOk(`${idpBaseUrl}/.well-known/openid-configuration`, {
            label: 'oauth-idp openid-configuration'
        });
    }

    if (spec.mcpMode === 'http' && spec.httpDemo) {
        const { port, args, mcpUrl } = buildHostLaunch(spec.httpDemo, demosRoot, process.env);
        const label = `mcp-http:${spec.httpDemo} (${mcpUrl})`;
        startService(label, args);
        await waitForMcpHost(label, port, mcpUrl);
    }

    if (spec.mcpMode === 'oauth' && spec.oauthDemo) {
        const { port, args, mcpUrl } = buildOAuthHostLaunch(spec.oauthDemo, demosRoot, process.env);
        const label = `mcp-oauth:${spec.oauthDemo} (${mcpUrl})`;
        startService(label, args);
        await waitForMcpHost(label, port, mcpUrl);
    }
}

async function main() {
    console.log(`[start:${demoName}] preparing demo (other running demos are left untouched)…`);
    prepareWorkspaceEnv();
    runNpm(['install']);
    runDbUp();
    generateAndCompile();
    if (foreground) {
        console.log(`[start:${demoName}] foreground mode — LOG_LEVEL=debug for services started here.`);
    }

    killPortsForDemo();
    await startMcpHosts();

    if (foreground) {
        printMcpReminder();
        console.log(`[start:${demoName}] Ctrl+C stops MCP/IDP processes started here.`);
        await waitForForegroundServiceShutdown({ label: `start:${demoName}`, serviceChildren, demosRoot });
        return;
    }

    console.log(`[start:${demoName}] done.`);
    printMcpReminder();
    if (spec.mcpMode === 'stdio') {
        console.log(`[start:${demoName}] Enable MCP server "${demoName}" in Cursor (stdio — no background MCP process).`);
    }
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[start:${demoName}] failed:`, message);
    process.exit(1);
});
