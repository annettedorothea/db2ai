#!/usr/bin/env node
/**
 * Demo workspace setup: kill stale MCP/IDP, env from example (once), install, Docker DBs, generate, compile, start MCP hosts.
 */
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadDemoEnvLocal } from './load-env-local.mjs';
import { buildHostLaunch, HTTP_INIT_DEMO_NAMES } from './mcp-http-demos.mjs';
import { buildOAuthHostLaunch, OAUTH_HTTP_INIT_DEMO_NAMES } from './mcp-oauth-demos.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
        return;
    }
    if (!existsSync(examplePath)) {
        console.warn(`[init] ${exampleName} missing — skip env copy.`);
        return;
    }
    copyFileSync(examplePath, targetPath);
    console.log(`[init] Created ${targetName} from ${exampleName} — edit database URLs and tokens as needed.`);
}

function startDetached(label, scriptPath, extraEnv = {}, logPort) {
    try {
        const child = spawn(process.execPath, [scriptPath], {
            cwd: demosRoot,
            detached: true,
            stdio: 'ignore',
            env: { ...process.env, ...extraEnv }
        });
        child.unref();
        const portHint = logPort ? ` port ${logPort}` : '';
        console.log(`[init] ${label} started in background${portHint}.`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[init] Could not start ${label}: ${message}`);
    }
}

function startNodeArgsDetached(label, args) {
    try {
        const child = spawn(process.execPath, args, {
            cwd: demosRoot,
            detached: true,
            stdio: 'ignore',
            env: process.env
        });
        child.unref();
        console.log(`[init] ${label} started in background.`);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[init] Could not start ${label}: ${message}`);
    }
}

console.log('[init] stopping previous demo processes…');
runNpm(['run', 'demo:kill-all']);

loadDemoEnvLocal();

ensureEnvFromExample('.env.example', '.env');
runNpm(['install']);
runNpm(['run', 'db:up:all']);
runNpm(['run', 'generate:all']);
runNpm(['run', 'build:generated']);

const idpPort = Number(process.env.ORDERS_DEMO_OAUTH_IDP_PORT) || 4863;
startDetached(
    'oauth-idp',
    path.join(demosRoot, 'oauth-idp', 'server.mjs'),
    { ORDERS_DEMO_OAUTH_IDP_PORT: String(idpPort), OAUTH_IDP_SIGN_ALG: 'RS256' },
    idpPort
);

for (const name of HTTP_INIT_DEMO_NAMES) {
    const { args, mcpUrl } = buildHostLaunch(name, demosRoot, process.env);
    startNodeArgsDetached(`mcp-http:${name} (${mcpUrl})`, args);
}

for (const name of OAUTH_HTTP_INIT_DEMO_NAMES) {
    const { args, mcpUrl } = buildOAuthHostLaunch(name, demosRoot, process.env);
    startNodeArgsDetached(`mcp-oauth:${name} (${mcpUrl})`, args);
}

console.log('[init] Done. Cursor Settings → Tools & MCPs: enable servers, then reload MCP.');
