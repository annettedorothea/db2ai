/**
 * MCP catalog entries for db2ai demos (shared by start.mjs).
 */
import { requireEnv, requireEnvInt } from './generated/require-env.mjs';
import { HTTP_DEMOS } from './mcp-http-demos.mjs';
import { OAUTH_HTTP_DEMOS } from './mcp-oauth-demos.mjs';

/** @param {string} portEnv @param {NodeJS.ProcessEnv} env */
function resolvePort(portEnv, env) {
    const raw = env[portEnv]?.trim();
    if (raw) {
        return requireEnvInt(portEnv, env);
    }
    const defaults = {
        SAKILA_MYSQL_HTTP_PORT: 4852,
        PAGILA_POSTGRESQL_HTTP_PORT: 4853,
        SAKILA_MARIADB_HTTP_PORT: 4854,
        ANIMALS_SQLSERVER_HTTP_PORT: 4855,
        PLANTS_ORACLE_HTTP_PORT: 4856,
        ORDERS_POSTGRESQL_OAUTH_HTTP_PORT: 4872
    };
    if (defaults[portEnv] !== undefined) {
        return defaults[portEnv];
    }
    return requireEnvInt(portEnv, env);
}

/**
 * @param {typeof HTTP_DEMOS[string]} demo
 * @param {NodeJS.ProcessEnv} env
 * @returns {string[]}
 */
function missingOptionalSecretEnvNames(demo, env) {
    return [...new Set([demo.authExpectedEnv].filter(Boolean))].filter((name) => !env[name]?.trim());
}

/**
 * @param {{ status: string, skipReason?: string }} entry
 * @param {typeof HTTP_DEMOS[string]} demo
 * @param {NodeJS.ProcessEnv} env
 */
function applySecretWarning(entry, demo, env) {
    if (entry.status !== 'running') {
        return entry;
    }
    const missing = missingOptionalSecretEnvNames(demo, env);
    if (missing.length === 0) {
        return entry;
    }
    return {
        ...entry,
        status: 'warning',
        skipReason: `${missing.join(', ')} missing — tool calls may fail until set in .env`
    };
}

/**
 * @param {string} name
 * @param {NodeJS.ProcessEnv} env
 * @param {{ status?: 'running' | 'warning' | 'skipped', skipReason?: string }} [options]
 */
export function buildHttpMcpCatalogEntry(name, env, options = {}) {
    const demo = HTTP_DEMOS[name];
    if (!demo) {
        throw new Error(`Unknown http demo: ${name}`);
    }
    const port = resolvePort(demo.portEnv, env);
    const status = options.status ?? 'running';
    /** @type {{ name: string, kind: string, port: number, auth: string, url: string, status: string, skipReason?: string, headers?: string }} */
    const entry = {
        name,
        kind: 'HTTP',
        port,
        auth: demo.connectionEnv ? `DB (${demo.connectionEnv})` : 'None',
        url: `http://127.0.0.1:${port}/mcp`,
        status
    };
    if (options.skipReason) {
        entry.skipReason = options.skipReason;
    }
    if (demo.authExpectedEnv) {
        const headerName = demo.mcpAuthHeaderEnv
            ? env[demo.mcpAuthHeaderEnv]?.trim() || 'x-api-token'
            : 'x-api-token';
        entry.auth = 'Header (mcp.json)';
        const headerValue = env[demo.authExpectedEnv]?.trim();
        entry.headers = headerValue
            ? JSON.stringify({ [headerName]: headerValue })
            : `${headerName}=<set in .env>`;
    }
    return applySecretWarning(entry, demo, env);
}

/**
 * @param {string} name
 * @param {NodeJS.ProcessEnv} env
 * @param {{ status?: 'running' | 'skipped', skipReason?: string }} [options]
 */
export function buildOAuthMcpCatalogEntry(name, env, options = {}) {
    const demo = OAUTH_HTTP_DEMOS[name];
    if (!demo) {
        throw new Error(`Unknown oauth http demo: ${name}`);
    }
    const port = resolvePort(demo.portEnv, env);
    return {
        name,
        kind: 'OAuth',
        port,
        auth: 'OAuth 2.1',
        url: `http://127.0.0.1:${port}/mcp`,
        status: options.status ?? 'running',
        skipReason: options.skipReason,
        clientId: 'mcp-demo-local',
        oauthServerUrl: requireEnv(demo.oauthIdpUrlEnv, env),
        oauthNote: 'Cursor: Sign-in on MCP server. DB via connection env in .env.'
    };
}

/**
 * @param {string[]} names
 * @param {NodeJS.ProcessEnv} env
 * @param {Map<string, { status?: 'running' | 'skipped', skipReason?: string }>} [statusByName]
 */
export function buildHttpMcpCatalogEntries(names, env, statusByName = new Map()) {
    return names.map((name) => {
        const statusInfo = statusByName.get(name) ?? { status: 'running' };
        try {
            return buildHttpMcpCatalogEntry(name, env, statusInfo);
        } catch (error) {
            if (statusInfo.status === 'skipped') {
                const demo = HTTP_DEMOS[name];
                const port = resolvePort(demo.portEnv, env);
                return {
                    name,
                    kind: 'HTTP',
                    port,
                    auth: '—',
                    url: `http://127.0.0.1:${port}/mcp`,
                    status: 'skipped',
                    skipReason: statusInfo.skipReason
                };
            }
            throw error;
        }
    });
}

/**
 * @param {string[]} names
 * @param {NodeJS.ProcessEnv} env
 * @param {Map<string, { status?: 'running' | 'skipped', skipReason?: string }>} [statusByName]
 */
export function buildOAuthMcpCatalogEntries(names, env, statusByName = new Map()) {
    return names.map((name) => {
        const statusInfo = statusByName.get(name) ?? { status: 'running' };
        if (statusInfo.status === 'skipped') {
            const demo = OAUTH_HTTP_DEMOS[name];
            const port = resolvePort(demo.portEnv, env);
            return {
                name,
                kind: 'OAuth',
                port,
                auth: 'OAuth 2.1',
                url: `http://127.0.0.1:${port}/mcp`,
                status: 'skipped',
                skipReason: statusInfo.skipReason,
                clientId: 'mcp-demo-local'
            };
        }
        return buildOAuthMcpCatalogEntry(name, env, statusInfo);
    });
}
