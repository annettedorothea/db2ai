/**
 * Relay HTTP MCP demo hosts (db2ai) — keys match .cursor/mcp.json server names.
 */
import path from 'node:path';
import { requireEnv, requireEnvInt } from '../generated/db2ai/scripts/require-env.mjs';
import { productName } from '../generated/db2ai/scripts/project-meta.mjs';

/** @param {string[]} args @param {string} demosRoot @param {string | undefined} iconRel */
function appendIconArg(args, demosRoot, iconRel) {
    const rel = iconRel?.trim();
    if (!rel) {
        return;
    }
    args.push('--icon', path.resolve(demosRoot, rel));
}

export const HTTP_DEMOS = {
    'sakila-mysql': {
        hostKind: 'passthrough-http',
        connectionEnv: 'SAKILA_MYSQL_DATABASE_URL',
        portEnv: 'SAKILA_MYSQL_HTTP_PORT',
        mcpAuthHeaderEnv: 'MCP_AUTH_HEADER',
        authExpectedEnv: 'MCP_AUTH_EXPECTED'
    },
    'sakila-mariadb': {
        hostKind: 'public-http',
        connectionEnv: 'SAKILA_MARIADB_DATABASE_URL',
        portEnv: 'SAKILA_MARIADB_HTTP_PORT'
    },
    'pagila-postgresql': {
        hostKind: 'passthrough-http',
        connectionEnv: 'PAGILA_POSTGRESQL_DATABASE_URL',
        portEnv: 'PAGILA_POSTGRESQL_HTTP_PORT',
        mcpAuthHeaderEnv: 'MCP_AUTH_HEADER',
        authExpectedEnv: 'MCP_AUTH_EXPECTED'
    },
    'animals-sqlserver': {
        hostKind: 'public-http',
        connectionEnv: 'ANIMALS_SQLSERVER_DATABASE_URL',
        portEnv: 'ANIMALS_SQLSERVER_HTTP_PORT',
        icon: 'icons/animals-sqlserver.png'
    },
    'plants-oracle': {
        hostKind: 'public-http',
        connectionEnv: 'PLANTS_ORACLE_DATABASE_URL',
        portEnv: 'PLANTS_ORACLE_HTTP_PORT',
        icon: 'icons/plants-oracle.png'
    },
    flight: {
        hostKind: 'public-http',
        portEnv: 'FLIGHT_HTTP_PORT'
    }
};

/** Hosts started by `npm run start:mcp` / `start:all` (HTTP entries in .cursor/mcp.json). */
export const HTTP_START_DEMO_NAMES = [
    'sakila-mysql',
    'sakila-mariadb',
    'pagila-postgresql',
    'animals-sqlserver',
    'plants-oracle',
    'flight'
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
    if (demo.connectionEnv) {
        requireEnv(demo.connectionEnv, env);
    }
    const port = requireEnvInt(demo.portEnv, env);
    const product = productName;
    const serverJs = path.join(
        demosRoot,
        'generated',
        product,
        'servers',
        `${name}-${demo.hostKind}-mcp-server.js`
    );
    const args = [serverJs, '--port', String(port), '--path', '/mcp'];
    appendIconArg(args, demosRoot, demo.icon);
    const mcpUrl = `http://127.0.0.1:${port}/mcp`;
    return { demo, port, args, mcpUrl };
}

export function listHttpPorts(env = process.env) {
    return HTTP_DEMO_NAMES.map((name) => requireEnvInt(HTTP_DEMOS[name].portEnv, env));
}
