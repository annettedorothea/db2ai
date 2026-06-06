#!/usr/bin/env node
/**
 * Demo workspace setup: kill stale MCP/IDP, env from example (once), install, Docker DBs, generate, compile, start MCP hosts.
 */
import { copyFileSync, existsSync, mkdirSync, openSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadDemoEnvLocal } from './load-env-local.mjs';
import { buildHostLaunch, HTTP_INIT_DEMO_NAMES } from './mcp-http-demos.mjs';
import { buildOAuthHostLaunch, OAUTH_HTTP_DEMOS, OAUTH_HTTP_INIT_DEMO_NAMES } from './mcp-oauth-demos.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const initLogDir = path.join(demosRoot, 'tmp', 'init-logs');

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

function detachedLogFd(label) {
    mkdirSync(initLogDir, { recursive: true });
    const safe = label.replace(/[^a-zA-Z0-9._-]+/g, '_');
    return openSync(path.join(initLogDir, `${safe}.log`), 'a');
}

function startDetached(label, scriptPath, extraEnv = {}, logPort) {
    try {
        const logFd = detachedLogFd(label);
        const child = spawn(process.execPath, [scriptPath], {
            cwd: demosRoot,
            detached: true,
            stdio: ['ignore', logFd, logFd],
            env: { ...process.env, ...extraEnv }
        });
        child.unref();
        const portHint = logPort ? ` port ${logPort}` : '';
        console.log(`[init] ${label} started in background${portHint} (log: tmp/init-logs/${label.replace(/[^a-zA-Z0-9._-]+/g, '_')}.log).`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[init] Could not start ${label}: ${message}`);
    }
}

function startNodeArgsDetached(label, args) {
    try {
        const logFd = detachedLogFd(label);
        const child = spawn(process.execPath, args, {
            cwd: demosRoot,
            detached: true,
            stdio: ['ignore', logFd, logFd],
            env: process.env
        });
        child.unref();
        console.log(
            `[init] ${label} started in background (log: tmp/init-logs/${label.replace(/[^a-zA-Z0-9._-]+/g, '_')}.log).`
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[init] Could not start ${label}: ${message}`);
    }
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

    const idpPort = Number(process.env.ORDERS_DATABASE_OAUTH_IDP_PORT) || 4863;
    const idpBaseUrl = `http://127.0.0.1:${idpPort}`;
    startDetached(
        'oauth-idp',
        path.join(demosRoot, 'oauth-idp', 'server.mjs'),
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
        startNodeArgsDetached(`mcp-http:${name} (${mcpUrl})`, args);
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
        startNodeArgsDetached(`mcp-oauth:${name} (${mcpUrl})`, args);
        try {
            await waitForTcpListen(port, { timeoutMs: 15_000 });
            console.log(`[init] mcp-oauth:${name} listening on port ${port}.`);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const logName = `mcp-oauth_${name}_(${mcpUrl})`.replace(/[^a-zA-Z0-9._-]+/g, '_');
            console.warn(
                `[init] ${message} — check tmp/init-logs/${logName}.log (common: missing ${connectionEnv}, IdP not ready, or stale ${demo.tools}).`
            );
        }
    }

    console.log('[init] Done. Cursor Settings → Tools & MCPs: enable servers, then reload MCP.');
}

main().catch((error) => {
    console.error('[init] failed:', error instanceof Error ? error.message : error);
    process.exit(1);
});
