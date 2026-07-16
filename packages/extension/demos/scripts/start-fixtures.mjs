#!/usr/bin/env node
/**
 * Start demo databases and OAuth IdP (no MCP hosts, no generate).
 *
 * Fixtures run detached (background); terminal returns when ports are ready.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
    demosRoot,
    prepareWorkspaceEnv,
    runNpm,
    setStartLogTag,
    startLogTag,
    startService,
    waitForHttpOk,
    waitForTcpListen
} from './start-shared.mjs';
import { requireEnvInt } from '../generated/db2ai/scripts/require-env.mjs';
import { killListenersOnPort } from '../generated/db2ai/scripts/kill-listeners-on-port.mjs';

/**
 * @param {string} [logTag]
 */
export async function startFixtures(logTag = 'start:fixtures') {
    setStartLogTag(logTag);

    console.log(`[${startLogTag}] starting all demo databases (plants-oracle may take several minutes on first pull)…`);
    runNpm(['run', 'db:up:all']);

    const idpPort = requireEnvInt('ORDERS_POSTGRESQL_OAUTH_IDP_PORT');
    const idpBaseUrl = `http://127.0.0.1:${idpPort}`;
    killListenersOnPort(idpPort, { logPrefix: 'oauth-idp:kill' });
    startService(
        'oauth-idp',
        [path.join(demosRoot, 'oauth-idp', 'server.mjs')],
        { ORDERS_POSTGRESQL_OAUTH_IDP_PORT: String(idpPort), OAUTH_IDP_SIGN_ALG: 'RS256' },
        idpPort,
        { detached: true }
    );

    console.log(`[${startLogTag}] waiting for oauth-idp at ${idpBaseUrl}…`);
    await waitForTcpListen(idpPort, { label: `oauth-idp port ${idpPort}` });
    await waitForHttpOk(`${idpBaseUrl}/.well-known/openid-configuration`, {
        label: 'oauth-idp openid-configuration',
        timeoutMs: 30_000
    });
}

async function main() {
    prepareWorkspaceEnv();
    await startFixtures();
    console.log('[start:fixtures] fixtures ready.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    main().catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[start:fixtures] failed:', message);
        process.exit(1);
    });
}
