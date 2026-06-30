/**
 * Relay HTTP MCP demo hosts (db2ai) — keys match .cursor/mcp.json server names.
 */
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { requireEnv, requireEnvInt } from './generated/require-env.mjs';

/** Default ports when omitted from .env — must match .cursor/mcp.json URLs. */
const DEFAULT_HTTP_PORTS = {
    SAKILA_MYSQL_HTTP_PORT: 4852,
    PAGILA_POSTGRESQL_HTTP_PORT: 4853,
    SAKILA_MARIADB_HTTP_PORT: 4854,
    ANIMALS_SQLSERVER_HTTP_PORT: 4855,
    PLANTS_ORACLE_HTTP_PORT: 4856
};

/**
 * @param {string} portEnv
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {number}
 */
function resolveHttpPort(portEnv, env = process.env) {
    const raw = env[portEnv]?.trim();
    if (raw) {
        const port = Number.parseInt(raw, 10);
        if (!Number.isFinite(port) || port <= 0) {
            console.error(`[env] Invalid ${portEnv}: ${raw}`);
            process.exit(1);
        }
        return port;
    }
    const fallback = DEFAULT_HTTP_PORTS[portEnv];
    if (fallback !== undefined) {
        return fallback;
    }
    return requireEnvInt(portEnv, env);
}

function loadProductName(demosRoot) {
    const config = JSON.parse(readFileSync(path.join(demosRoot, 'project-generate.config.json'), 'utf-8'));
    return config.productName;
}

export const HTTP_DEMOS = {
    'sakila-mysql': {
        host: 'passthrough-http-mcp-server.js',
        tools: 'sakila-mysql-tools.js',
        connectionEnv: 'SAKILA_MYSQL_DATABASE_URL',
        portEnv: 'SAKILA_MYSQL_HTTP_PORT',
        mcpAuthHeaderEnv: 'MCP_AUTH_HEADER',
        authExpectedEnv: 'MCP_AUTH_EXPECTED'
    },
    'sakila-mariadb': {
        host: 'public-http-mcp-server.js',
        tools: 'sakila-mariadb-tools.js',
        connectionEnv: 'SAKILA_MARIADB_DATABASE_URL',
        portEnv: 'SAKILA_MARIADB_HTTP_PORT'
    },
    'pagila-postgresql': {
        host: 'passthrough-http-mcp-server.js',
        tools: 'pagila-postgresql-tools.js',
        connectionEnv: 'PAGILA_POSTGRESQL_DATABASE_URL',
        portEnv: 'PAGILA_POSTGRESQL_HTTP_PORT',
        mcpAuthHeaderEnv: 'MCP_AUTH_HEADER',
        authExpectedEnv: 'MCP_AUTH_EXPECTED'
    },
    'animals-sqlserver': {
        host: 'public-http-mcp-server.js',
        tools: 'animals-sqlserver-tools.js',
        connectionEnv: 'ANIMALS_SQLSERVER_DATABASE_URL',
        portEnv: 'ANIMALS_SQLSERVER_HTTP_PORT'
    },
    'plants-oracle': {
        host: 'public-http-mcp-server.js',
        tools: 'plants-oracle-tools.js',
        connectionEnv: 'PLANTS_ORACLE_DATABASE_URL',
        portEnv: 'PLANTS_ORACLE_HTTP_PORT'
    }
};

/** Hosts started by `npm run start` (HTTP entries in .cursor/mcp.json). */
export const HTTP_START_DEMO_NAMES = [
    'sakila-mysql',
    'sakila-mariadb',
    'pagila-postgresql',
    'animals-sqlserver',
    'plants-oracle'
];

export const HTTP_DEMO_NAMES = Object.keys(HTTP_DEMOS);

/**
 * @param {string} name
 * @param {string} demosRoot
 * @param {NodeJS.ProcessEnv} env
 */
export function buildHostLaunch(name, demosRoot, env) {
    const demo = HTTP_DEMOS[name];
    if (!demo) {
        throw new Error(`Unknown http demo: ${name}`);
    }
    requireEnv(demo.connectionEnv, env);
    const port = resolveHttpPort(demo.portEnv, env);
    const product = loadProductName(demosRoot);
    const hostJs = path.join(demosRoot, 'generated', product, 'cli', demo.host);
    const toolsJs = path.join(demosRoot, 'generated', product, 'tools', demo.tools);
    const args = [hostJs, toolsJs, '--port', String(port), '--path', '/mcp'];
    const mcpUrl = `http://127.0.0.1:${port}/mcp`;
    return { demo, port, args, mcpUrl };
}

export function listHttpPorts(env = process.env) {
    return HTTP_DEMO_NAMES.map((name) => resolveHttpPort(HTTP_DEMOS[name].portEnv, env));
}
