#!/usr/bin/env node
/**
 * Demo workspace setup: kill stale MCP/IDP, env from example (once), install, all Docker DBs (incl. Oracle),
 * generate, compile, start MCP hosts.
 *
 * plants-oracle is slow on first pull; one-time: docker login container-registry.oracle.com
 *
 * Default (npm run start): background — terminal free after setup.
 * Foreground (npm run start:foreground): logs in this terminal until Ctrl+C.
 */
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadProjectEnvLocal } from './generated/load-env-local.mjs';
import { requireEnvInt } from './generated/require-env.mjs';
import { buildHostLaunch, HTTP_START_DEMO_NAMES } from './mcp-http-demos.mjs';
import { buildOAuthHostLaunch, OAUTH_HTTP_START_DEMO_NAMES } from './mcp-oauth-demos.mjs';
import { waitForForegroundServiceShutdown } from './foreground-lifecycle.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const foreground =
    process.env.START_FOREGROUND === '1' ||
    process.env.START_FOREGROUND === 'true' ||
    process.env.START_FOREGROUND === 'yes';

/** @type {import('node:child_process').ChildProcess[]} */
const serviceChildren = [];

function runNpm(args) {
    const result = spawnSync('npm', args, { cwd: demosRoot, stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

function ensureEnvFromExample(exampleName, targetName) {
    const examplePath = path.join(demosRoot, exampleName);
    const targetPath = path.join(demosRoot, targetName);
    if (existsSync(targetPath)) {
        console.log(`[start] ${targetName} already exists — not overwritten.`);
        return false;
    }
    if (!existsSync(examplePath)) {
        console.error(`[start] ${exampleName} missing — create ${targetName} with required variables.`);
        process.exit(1);
    }
    copyFileSync(examplePath, targetPath);
    console.log(`[start] Created ${targetName} from ${exampleName} — edit database URLs and tokens as needed.`);
    return true;
}

function logPrefix(label) {
    const m = label.match(/^(mcp-(?:http|oauth):[^\s(]+)/);
    if (m) {
        return m[1];
    }
    return label.split(/\s/)[0].trim();
}

function buildServiceEnv(label, extraEnv = {}) {
    const env = { ...process.env, ...extraEnv, LOG_SERVICE_PREFIX: logPrefix(label) };
    if (foreground) {
        env.LOG_LEVEL = 'debug';
    }
    return env;
}

function startService(label, argv, extraEnv = {}, logPort) {
    const env = buildServiceEnv(label, extraEnv);
    const portHint = logPort ? ` port ${logPort}` : '';
    if (foreground) {
        const child = spawn(process.execPath, argv, {
            cwd: demosRoot,
            stdio: 'inherit',
            env
        });
        serviceChildren.push(child);
        console.log(`[start] ${label} started in foreground${portHint}`);
        return;
    }
    const child = spawn(process.execPath, argv, {
        cwd: demosRoot,
        detached: true,
        stdio: 'ignore',
        env
    });
    child.unref();
    console.log(`[start] ${label} started in background${portHint}`);
}

async function waitForHttpOk(url, { timeoutMs = 20_000, intervalMs = 200, label = url } = {}) {
    const deadline = Date.now() + timeoutMs;
    let lastError = 'unknown';
    while (Date.now() < deadline) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return;
            }
            lastError = `HTTP ${response.status}`;
        } catch (error) {
            lastError = error instanceof Error ? error.message : String(error);
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Timed out waiting for ${label} (${lastError})`);
}

async function waitForTcpListen(port, { timeoutMs = 15_000, intervalMs = 200, label = `port ${port}` } = {}) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const raw = spawnSync('lsof', ['-nP', `-iTCP:${port}`, '-sTCP:LISTEN', '-t'], { encoding: 'utf8' });
            if (raw.status === 0 && raw.stdout.trim().length > 0) {
                return;
            }
        } catch {
            /* retry */
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Timed out waiting for TCP listener on ${label}`);
}

async function waitForMcpHost(label, port, mcpUrl) {
    await waitForTcpListen(port, { label: mcpUrl });
    console.log(`[start] ${label} listening on port ${port}.`);
}

async function main() {
    console.log('[start] stopping previous demo processes…');
    runNpm(['run', 'demo:kill-all']);

    loadProjectEnvLocal();
    const createdEnv = ensureEnvFromExample('.env.example', '.env');
    if (createdEnv) {
        loadProjectEnvLocal();
    }

    runNpm(['install']);
    console.log('[start] starting all demo databases (plants-oracle may take several minutes on first pull)…');
    runNpm(['run', 'db:up:all']);
    runNpm(['run', 'generate:all']);
    runNpm(['run', 'build:generated']);
    if (foreground) {
        console.log('[start] Foreground mode — LOG_LEVEL=debug for services, logs in this terminal.');
    }

    const idpPort = requireEnvInt('ORDERS_POSTGRES_OAUTH_IDP_PORT');
    const idpBaseUrl = `http://127.0.0.1:${idpPort}`;
    startService(
        'oauth-idp',
        [path.join(demosRoot, 'oauth-idp', 'server.mjs')],
        { ORDERS_POSTGRES_OAUTH_IDP_PORT: String(idpPort), OAUTH_IDP_SIGN_ALG: 'RS256' },
        idpPort
    );

    console.log(`[start] waiting for oauth-idp at ${idpBaseUrl}…`);
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
        console.log('[start] Setup done — services running. Cursor Settings → Tools & MCPs: enable servers, then reload MCP.');
        console.log('[start] Ctrl+C stops MCP/IDP processes started here (npm run demo:kill-all also stops Docker).');
        await waitForForegroundServiceShutdown({ label: 'start', serviceChildren, demosRoot });
        return;
    }
    console.log('[start] Done. Demo services run in background (npm run demo:kill-all stops MCP, IDP, and Docker).');
    console.log('[start] Cursor Settings → Tools & MCPs: enable servers, then reload MCP.');
    console.log('[start] Live logs: npm run start:foreground');
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[start] failed:', message);
    process.exit(1);
});
