#!/usr/bin/env node
/**
 * Demo workspace setup: kill stale MCP/IDP, env from example (once), install, Docker DBs, generate, compile,
 * start MCP hosts.
 *
 * Default (npm run init): background — terminal free after setup.
 * Foreground (npm run init:foreground): logs in this terminal until Ctrl+C.
 */
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadDemoEnvLocal } from './load-env-local.mjs';
import { buildHostLaunch, HTTP_INIT_DEMO_NAMES } from './mcp-http-demos.mjs';
import { buildOAuthHostLaunch, OAUTH_HTTP_DEMOS, OAUTH_HTTP_INIT_DEMO_NAMES } from './mcp-oauth-demos.mjs';
const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const foreground =
    process.env.INIT_FOREGROUND === '1' ||
    process.env.INIT_FOREGROUND === 'true' ||
    process.env.INIT_FOREGROUND === 'yes';

/** Foreground children — stopped on Ctrl+C. */
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
        console.log(`[init] ${targetName} already exists — not overwritten.`);
        return false;
    }
    if (!existsSync(examplePath)) {
        console.warn(`[init] ${exampleName} missing — skip env copy.`);
        return false;
    }
    copyFileSync(examplePath, targetPath);
    console.log(`[init] Created ${targetName} from ${exampleName} — edit database URLs and tokens as needed.`);
    return true;
}

/** Short log prefix — display labels may include URL in parentheses. */
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
    try {
        const env = buildServiceEnv(label, extraEnv);
        const portHint = logPort ? ` port ${logPort}` : '';
        if (foreground) {
            const child = spawn(process.execPath, argv, {
                cwd: demosRoot,
                stdio: 'inherit',
                env
            });
            serviceChildren.push(child);
            console.log(`[init] ${label} started in foreground${portHint}`);
            return;
        }
        const child = spawn(process.execPath, argv, {
            cwd: demosRoot,
            detached: true,
            stdio: 'ignore',
            env
        });
        child.unref();
        console.log(`[init] ${label} started in background${portHint}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[init] Could not start ${label}: ${message}`);
    }
}

function waitForShutdownSignal() {
    return new Promise((resolve) => {
        const shutdown = (signal) => {
            console.log(`[init] ${signal} — stopping demo services…`);
            for (const child of serviceChildren) {
                if (child.pid) {
                    try {
                        process.kill(child.pid, 'SIGTERM');
                    } catch {
                        /* already exited */
                    }
                }
            }
            resolve();
        };
        process.once('SIGINT', () => shutdown('SIGINT'));
        process.once('SIGTERM', () => shutdown('SIGTERM'));
    });
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

async function waitForTcpListen(port, { timeoutMs = 15_000, intervalMs = 200 } = {}) {
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
    throw new Error(`Timed out waiting for TCP listener on port ${port}`);
}

async function main() {
    console.log('[init] stopping previous demo processes…');
    runNpm(['run', 'demo:kill-all']);

    loadDemoEnvLocal();
    const createdEnv = ensureEnvFromExample('.env.example', '.env');
    if (createdEnv) {
        loadDemoEnvLocal();
    }

    runNpm(['install']);
    runNpm(['run', 'db:up:all']);
    runNpm(['run', 'generate:all']);
    runNpm(['run', 'build:generated']);
    if (foreground) {
        console.log('[init] Foreground mode — LOG_LEVEL=debug for services, logs in this terminal.');
    }

    const idpPort = Number(process.env.ORDERS_DATABASE_OAUTH_IDP_PORT) || 4863;
    const idpBaseUrl = `http://127.0.0.1:${idpPort}`;
    startService(
        'oauth-idp',
        [path.join(demosRoot, 'oauth-idp', 'server.mjs')],
        { ORDERS_DATABASE_OAUTH_IDP_PORT: String(idpPort), OAUTH_IDP_SIGN_ALG: 'RS256' },
        idpPort
    );

    console.log(`[init] waiting for oauth-idp at ${idpBaseUrl}…`);
    try {
        await waitForHttpOk(`${idpBaseUrl}/.well-known/openid-configuration`, {
            label: 'oauth-idp openid-configuration'
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[init] ${message} — OAuth MCP hosts may fail JWKS startup.`);
    }

    for (const name of HTTP_INIT_DEMO_NAMES) {
        const { args, mcpUrl } = buildHostLaunch(name, demosRoot, process.env);
        startService(`mcp-http:${name} (${mcpUrl})`, args);
    }

    for (const name of OAUTH_HTTP_INIT_DEMO_NAMES) {
        const demo = OAUTH_HTTP_DEMOS[name];
        const { port, args, mcpUrl } = buildOAuthHostLaunch(name, demosRoot, process.env);
        const connectionEnv = demo.connectionEnv;
        if (connectionEnv && !process.env[connectionEnv]?.trim()) {
            console.warn(
                `[init] ${connectionEnv} is missing — mcp-oauth:${name} will exit before listening. Copy .env.example → .env and set database URL.`
            );
        }
        startService(`mcp-oauth:${name} (${mcpUrl})`, args);
        try {
            await waitForTcpListen(port, { timeoutMs: 15_000 });
            console.log(`[init] mcp-oauth:${name} listening on port ${port}.`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(
                `[init] ${message} (common: missing ${connectionEnv}, IdP not ready, or stale ${demo.tools})`
            );
        }
    }

    if (foreground) {
        console.log('[init] Setup done — services running. Cursor Settings → Tools & MCPs: enable servers, then reload MCP.');
        console.log('[init] Ctrl+C stops all demo processes started here.');
        await waitForShutdownSignal();
        return;
    }
    console.log('[init] Done. Demo services run in background (npm run demo:kill-all to stop).');
    console.log('[init] Cursor Settings → Tools & MCPs: enable servers, then reload MCP.');
    console.log('[init] Live logs: npm run init:foreground');
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[init] failed:', message);
    process.exit(1);
});
