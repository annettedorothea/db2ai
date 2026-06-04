/**
 * Stateless HTTP MCP demo hosts (db2ai).
 */
import path from 'node:path';

export const HTTP_DEMOS = {
    pagila: {
        tools: 'pagila-tools.js',
        connectionEnv: 'PAGILA_DATABASE_URL',
        defaultConnection: 'postgresql://postgres:postgres@localhost:55432/pagila',
        portEnv: 'PAGILA_HTTP_PORT',
        defaultPort: 3853,
        mcpUrl: 'http://127.0.0.1:3853/mcp',
        prerequisite: 'npm run db:pagila:up'
    },
    sakila: {
        tools: 'sakila-tools.js',
        connectionEnv: 'SAKILA_DATABASE_URL',
        defaultConnection: 'mysql://sakila:p_ssW0rd@localhost:53306/sakila',
        portEnv: 'SAKILA_HTTP_PORT',
        defaultPort: 3854,
        mcpUrl: 'http://127.0.0.1:3854/mcp',
        prerequisite: 'npm run db:sakila:up'
    },
    'access-demo': {
        tools: 'access-demo-tools.js',
        connectionEnv: 'ACCESS_DEMO_DATABASE_URL',
        portEnv: 'ACCESS_DEMO_HTTP_PORT',
        defaultPort: 3852,
        mcpUrl: 'http://127.0.0.1:3852/mcp',
        prerequisite: 'npm run db:access-demo:up'
    }
};

export const HTTP_DEMO_NAMES = Object.keys(HTTP_DEMOS);

export function resolvePort(demo, env = process.env) {
    const raw = env[demo.portEnv];
    if (raw === undefined || raw.trim() === '') {
        return demo.defaultPort;
    }
    const port = Number.parseInt(raw, 10);
    if (!Number.isFinite(port) || port <= 0) {
        throw new Error(`Invalid ${demo.portEnv}: ${raw}`);
    }
    return port;
}

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
    if (demo.defaultConnection && !env[demo.connectionEnv]?.trim()) {
        env[demo.connectionEnv] = demo.defaultConnection;
    }
    const connectionString = env[demo.connectionEnv]?.trim();
    if (!connectionString) {
        throw new Error(
            `Missing ${demo.connectionEnv} for ${name}. ${demo.prerequisite ?? 'Set connection URL in .env'}.`
        );
    }
    const port = resolvePort(demo, env);
    const hostJs = path.join(demosRoot, 'generated/cli/stateless-http-mcp-server.js');
    const toolsJs = path.join(demosRoot, 'generated/tools', demo.tools);
    const args = [hostJs, toolsJs, '--port', String(port), '--path', '/mcp'];
    return { demo, port, args, mcpUrl: demo.mcpUrl };
}

export function listHttpPorts(env = process.env) {
    return HTTP_DEMO_NAMES.map((name) => resolvePort(HTTP_DEMOS[name], env));
}
