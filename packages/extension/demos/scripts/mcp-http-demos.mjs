/**
 * Stateless HTTP MCP demo hosts (db2ai) — keys match .cursor/mcp.json server names.
 */
import path from 'node:path';

export const HTTP_DEMOS = {
    pagila: {
        tools: 'pagila-tools.js',
        connectionEnv: 'PAGILA_DATABASE_URL',
        defaultConnection: 'postgresql://postgres:postgres@localhost:55432/pagila',
        portEnv: 'PAGILA_HTTP_PORT',
        defaultPort: 4853,
        prerequisite: 'Docker Pagila',
        credentialValidation: 'static',
        authExpectedEnv: 'MCP_AUTH_EXPECTED'
    }
};

/** Hosts started by `npm run init` (HTTP entries in .cursor/mcp.json). */
export const HTTP_INIT_DEMO_NAMES = ['pagila'];

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
    if (demo.credentialValidation) {
        args.push('--credential-validation', demo.credentialValidation);
        if (demo.authExpectedEnv) {
            args.push('--auth-expected-env', demo.authExpectedEnv);
        }
    }
    const mcpUrl = `http://127.0.0.1:${port}/mcp`;
    return { demo, port, args, mcpUrl, credentialValidation: demo.credentialValidation };
}

export function listHttpPorts(env = process.env) {
    return HTTP_DEMO_NAMES.map((name) => resolvePort(HTTP_DEMOS[name], env));
}
