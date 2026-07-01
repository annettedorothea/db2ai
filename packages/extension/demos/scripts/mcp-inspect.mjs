#!/usr/bin/env node
/**
 * Start one demo MCP host (optional) and open MCP Inspector (Streamable HTTP).
 *
 * Usage:
 *   node scripts/mcp-inspect.mjs <demo-name> [--no-start]
 *
 * When starting a host, the matching database (and oauth-idp for orders-postgresql) is started first.
 *
 * Examples:
 *   npm run mcp:inspect -- pagila-postgresql
 *   npm run mcp:inspect -- orders-postgresql --no-start
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DEMO_LAUNCH_NAMES, DEMO_LAUNCH_REGISTRY } from './demo-launch-registry.mjs';
import { buildHostLaunch } from './mcp-http-demos.mjs';
import { buildOAuthHostLaunch } from './mcp-oauth-demos.mjs';
import { killListenersOnPort } from './generated/kill-listeners-on-port.mjs';
import { requireEnvInt } from './generated/require-env.mjs';
import { demosRoot, prepareWorkspaceEnv, waitForHttpOk, waitForTcpListen } from './start-shared.mjs';

/** @type {import('node:child_process').ChildProcess[]} */
const serviceChildren = [];

function usage() {
    console.error(`Usage: node scripts/mcp-inspect.mjs <${DEMO_LAUNCH_NAMES.join('|')}> [--no-start]`);
    process.exit(1);
}

function parseArgs(argv) {
    const positional = [];
    let noStart = false;
    for (const arg of argv) {
        if (arg === '--no-start') {
            noStart = true;
        } else if (arg.startsWith('-')) {
            console.error(`[mcp:inspect] unknown option: ${arg}`);
            usage();
        } else {
            positional.push(arg);
        }
    }
    const demoName = positional[0]?.trim();
    if (!demoName || positional.length > 1) {
        usage();
    }
    if (!DEMO_LAUNCH_REGISTRY[demoName]) {
        console.error(`[mcp:inspect] unknown demo: ${demoName}`);
        usage();
    }
    return { demoName, noStart };
}

/**
 * @param {string} demoName
 * @returns {{ url: string, headers: Record<string, string>, oauth: boolean }}
 */
function loadMcpJsonEntry(demoName) {
    const configPath = path.join(demosRoot, '.cursor', 'mcp.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    const server = config.mcpServers?.[demoName];
    if (!server?.url) {
        throw new Error(`No url for "${demoName}" in .cursor/mcp.json`);
    }
    return {
        url: server.url,
        headers: server.headers ?? {},
        oauth: Boolean(server.auth)
    };
}

function runDbUp(demoName) {
    console.log(`[mcp:inspect] starting database for ${demoName}…`);
    const result = spawnSync(process.execPath, [path.join(demosRoot, 'scripts/database/db-up-one.mjs'), demoName], {
        cwd: demosRoot,
        stdio: 'inherit',
        env: process.env
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}

async function startOAuthIdp() {
    const idpPort = requireEnvInt('ORDERS_POSTGRESQL_OAUTH_IDP_PORT');
    const idpBaseUrl = `http://127.0.0.1:${idpPort}`;
    killListenersOnPort(idpPort, { logPrefix: 'oauth-idp:kill' });
    startBackground('oauth-idp', [path.join(demosRoot, 'oauth-idp', 'server.mjs')], {
        ORDERS_POSTGRESQL_OAUTH_IDP_PORT: String(idpPort),
        OAUTH_IDP_SIGN_ALG: 'RS256'
    });
    console.log(`[mcp:inspect] waiting for oauth-idp at ${idpBaseUrl}…`);
    await waitForHttpOk(`${idpBaseUrl}/.well-known/openid-configuration`, {
        label: 'oauth-idp openid-configuration'
    });
}

function startBackground(label, argv, extraEnv = {}) {
    const env = { ...process.env, ...extraEnv, LOG_SERVICE_PREFIX: label, LOG_LEVEL: 'debug' };
    const child = spawn(process.execPath, argv, {
        cwd: demosRoot,
        stdio: 'ignore',
        env
    });
    serviceChildren.push(child);
    console.log(`[mcp:inspect] ${label} started (pid ${child.pid ?? '?'})`);
    return child;
}

/**
 * @param {string} demoName
 * @param {boolean} noStart
 */
async function ensureHostRunning(demoName, noStart) {
    const spec = DEMO_LAUNCH_REGISTRY[demoName];
    const mcpEntry = loadMcpJsonEntry(demoName);

    if (noStart) {
        console.log(`[mcp:inspect] --no-start: connecting to ${mcpEntry.url}`);
        return mcpEntry;
    }

    runDbUp(demoName);

    if (spec.oauthIdp) {
        await startOAuthIdp();
    }

    let port;
    let args;
    let mcpUrl;
    const labelPrefix = spec.mcpMode === 'oauth' ? 'mcp-oauth' : 'mcp-http';
    const launchKey = spec.mcpMode === 'oauth' ? spec.oauthDemo : spec.httpDemo;

    if (spec.mcpMode === 'http' && spec.httpDemo) {
        ({ port, args, mcpUrl } = buildHostLaunch(spec.httpDemo, demosRoot, process.env));
    } else if (spec.mcpMode === 'oauth' && spec.oauthDemo) {
        ({ port, args, mcpUrl } = buildOAuthHostLaunch(spec.oauthDemo, demosRoot, process.env));
    } else {
        throw new Error(`Invalid launch spec for ${demoName}`);
    }

    killListenersOnPort(port, { logPrefix: `${labelPrefix}:${launchKey}:kill` });
    startBackground(`${labelPrefix}:${launchKey}`, args);
    await waitForTcpListen(port, { label: mcpUrl });
    console.log(`[mcp:inspect] MCP host listening at ${mcpUrl}`);

    return { ...mcpEntry, url: mcpUrl };
}

function buildInspectorArgs(mcpEntry) {
    const args = [
        '-y',
        '@modelcontextprotocol/inspector',
        '--transport',
        'http',
        '--server-url',
        mcpEntry.url
    ];
    for (const [key, value] of Object.entries(mcpEntry.headers)) {
        args.push('--header', `${key}: ${value}`);
    }
    return args;
}

function shutdownServices() {
    for (const child of serviceChildren) {
        if (child.exitCode === null && child.pid) {
            try {
                process.kill(child.pid, 'SIGTERM');
            } catch {
                /* already gone */
            }
        }
    }
}

function runInspector(inspectorArgs) {
    return new Promise((resolve) => {
        const child = spawn('npx', inspectorArgs, {
            cwd: demosRoot,
            stdio: 'inherit',
            shell: process.platform === 'win32',
            env: process.env
        });
        child.on('exit', (code, signal) => {
            resolve(code ?? (signal ? 1 : 0));
        });
    });
}

async function main() {
    const { demoName, noStart } = parseArgs(process.argv.slice(2));
    prepareWorkspaceEnv();

    const mcpEntry = await ensureHostRunning(demoName, noStart);
    const inspectorArgs = buildInspectorArgs(mcpEntry);

    if (mcpEntry.oauth) {
        console.warn(
            '[mcp:inspect] OAuth demo: Inspector has no Cursor Sign-in — initialize/tool calls may fail with 401. Prefer Cursor for OAuth flows.'
        );
    }

    console.log(`[mcp:inspect] opening MCP Inspector → ${mcpEntry.url}`);
    if (Object.keys(mcpEntry.headers).length > 0) {
        console.log(`[mcp:inspect] headers: ${JSON.stringify(mcpEntry.headers)}`);
    }

    const onSignal = () => {
        shutdownServices();
        process.exit(130);
    };
    process.on('SIGINT', onSignal);
    process.on('SIGTERM', onSignal);

    try {
        const code = await runInspector(inspectorArgs);
        shutdownServices();
        process.exit(code);
    } catch (error) {
        shutdownServices();
        throw error;
    }
}

main().catch((error) => {
    shutdownServices();
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mcp:inspect] failed:', message);
    process.exit(1);
});
