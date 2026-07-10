#!/usr/bin/env node
/**
 * Open MCP Inspector for a demo HTTP host that is already running.
 *
 * Prerequisite: `npm run start:all` (or `npm run start:mcp` with databases/IdP already up).
 *
 * Usage:
 *   npm run mcp:inspect -- <demo-name>
 *
 * Example:
 *   npm run mcp:inspect -- orders-postgresql
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { DEMO_LAUNCH_NAMES, DEMO_LAUNCH_REGISTRY } from './demo-launch-registry.mjs';
import { HTTP_DEMOS } from './mcp-http-demos.mjs';
import { buildOAuthHostLaunch, OAUTH_HTTP_DEMOS } from './mcp-oauth-demos.mjs';
import { demosRoot, prepareWorkspaceEnv } from './start-shared.mjs';

const AUTH_BANNER = [
    '  ╭──────────────────────────────────────────────╮',
    '  │  MCP Inspector · Authentication              │',
    '  ╰──────────────────────────────────────────────╯'
].join('\n');

const INSPECTOR_REDIRECT_URL = 'http://localhost:6274/oauth/callback';
const DEMO_OAUTH_CLIENT_ID = 'mcp-demo-local';

/**
 * @param {NodeJS.ProcessEnv} env
 */
function warnIfInspectorRedirectMissing(env) {
    const rules = (env.OAUTH_IDP_REDIRECT_URIS ?? '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    const needed = INSPECTOR_REDIRECT_URL;
    const allowed = rules.some((rule) => {
        if (rule.endsWith('*')) {
            return needed.startsWith(rule.slice(0, -1));
        }
        return rule === needed;
    });
    if (!allowed) {
        console.log('  Warning: add this to OAUTH_IDP_REDIRECT_URIS in .env, then restart IdP:');
        printAuthField('Missing:', needed);
        console.log('  (Inspector sets Redirect URL automatically — you cannot edit it in the UI.)');
        console.log('');
    }
}

/**
 * @param {string} label
 * @param {string} value
 */
function printAuthField(label, value) {
    const pad = ' '.repeat(Math.max(1, 16 - label.length));
    console.log(`     ${label}${pad}${value}`);
}

/**
 * @param {string} name
 * @param {string} value
 */
function printAuthHeader(name, value) {
    console.log('  Custom Headers — enable toggle, then set:');
    printAuthField('Name:', name);
    printAuthField('Value:', value);
}

/**
 * @param {{ mcpUrl: string, oauthServerUrl: string, scope: string, bearerHint: string, env?: NodeJS.ProcessEnv }} options
 */
function printOAuthBlock({ mcpUrl, oauthServerUrl, scope, bearerHint, env = process.env }) {
    console.log('  Recommended for Inspector — Custom Headers (skip OAuth UI):');
    console.log(`     ${bearerHint}`);
    printAuthField('Name:', 'Authorization');
    printAuthField('Value:', 'Bearer <token from command above>');
    console.log('');
    console.log('  Optional — OAuth 2.0 tab (browser CORS; IdP must be running):');
    printAuthField('Client ID:', DEMO_OAUTH_CLIENT_ID);
    printAuthField('Client Secret:', '(leave empty)');
    printAuthField('Server URL:', `${mcpUrl}  (Inspector connection — OAuth metadata served here)`);
    printAuthField('OAuth Server URL:', `${oauthServerUrl}  (IdP — token exchange; optional if auto-discovered)`);
    printAuthField('Scope:', scope);
    printAuthField('Redirect URL:', `${INSPECTOR_REDIRECT_URL}  (read-only in Inspector)`);
    warnIfInspectorRedirectMissing(env);
    console.log('  Note: do not use JWT secrets (e.g. BOOKINGS_API_JWT_SECRET) as Client ID.');
    console.log('');
}

/**
 * @param {string} demoName
 * @param {NodeJS.ProcessEnv} env
 */
function printMcpInspectAuthHints(demoName, env = process.env) {
    console.log('');
    console.log(AUTH_BANNER);
    console.log(`  Demo: ${demoName}`);
    console.log('');

    const httpDemo = HTTP_DEMOS[demoName];
    const oauthDemo = OAUTH_HTTP_DEMOS[demoName];

    if (httpDemo && !httpDemo.authExpectedEnv) {
        console.log('  Authentication: none (public HTTP host).');
        console.log('');
        return;
    }

    if (httpDemo?.authExpectedEnv) {
        const headerName = env.MCP_AUTH_HEADER?.trim() || 'x-api-token';
        const headerValue = env.MCP_AUTH_EXPECTED?.trim() || 'demo';
        printAuthHeader(headerName, headerValue);
        console.log('  Must match MCP_AUTH_EXPECTED in .env.');
        console.log('');
        return;
    }

    if (demoName === 'orders-postgresql') {
        const oauthServerUrl = env.ORDERS_POSTGRESQL_OAUTH_IDP_URL?.trim() || 'http://127.0.0.1:4863';
        const { mcpUrl } = buildOAuthHostLaunch(demoName, demosRoot, env);
        printOAuthBlock({
            mcpUrl,
            oauthServerUrl,
            scope: oauthDemo?.oauthScope ?? 'orders-postgresql',
            bearerHint: `Run: node ${path.join(demosRoot, 'orders-postgresql/get-token.mjs')} alice`
        });
        return;
    }

    console.log('  See .cursor/mcp.json and core2ai/docs/testing/mcp-inspector.md');
    console.log('');
}

function usage() {
    console.error(`Usage: npm run mcp:inspect -- <${DEMO_LAUNCH_NAMES.join('|')}>`);
    console.error('Prerequisite: MCP host already running (npm run start:all or npm run start:mcp).');
    process.exit(1);
}

function parseDemoName(argv) {
    const positional = [];
    for (const arg of argv) {
        if (arg.startsWith('-')) {
            console.error(`[mcp:inspect] unknown option: ${arg} (start hosts with npm run start:all first)`);
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
    return demoName;
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
    const demoName = parseDemoName(process.argv.slice(2));
    prepareWorkspaceEnv();

    const mcpEntry = loadMcpJsonEntry(demoName);
    console.log(`[mcp:inspect] connecting to ${mcpEntry.url}`);

    printMcpInspectAuthHints(demoName, process.env);

    console.log(`[mcp:inspect] opening MCP Inspector → ${mcpEntry.url}`);
    if (Object.keys(mcpEntry.headers).length > 0) {
        console.log(`[mcp:inspect] pre-filled headers (CLI): ${JSON.stringify(mcpEntry.headers)}`);
    }

    const code = await runInspector(buildInspectorArgs(mcpEntry));
    process.exit(code);
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mcp:inspect] failed:', message);
    process.exit(1);
});
