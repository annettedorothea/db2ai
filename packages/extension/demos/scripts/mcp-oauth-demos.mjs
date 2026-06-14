/**
 * OAuth HTTP MCP demo hosts (db2ai) — keys match .cursor/mcp.json server names.
 */
import path from 'node:path';

export const OAUTH_HTTP_DEMOS = {
    orders: {
        tools: 'orders-postgres-tools.js',
        connectionEnv: 'ORDERS_POSTGRES_DATABASE_URL',
        oauthIdpUrlEnv: 'ORDERS_POSTGRES_OAUTH_IDP_URL',
        defaultOAuthIdpUrl: 'http://127.0.0.1:4863',
        portEnv: 'ORDERS_POSTGRES_OAUTH_HTTP_PORT',
        defaultPort: 4871,
        oauthScope: 'orders-postgres',
        mcpServerName: 'orders',
        prerequisite: 'Docker orders-postgres + oauth-idp :4863 (RS256)'
    }
};

/** OAuth MCP hosts started by `npm run start`. */
export const OAUTH_HTTP_START_DEMO_NAMES = ['orders'];

export const OAUTH_HTTP_DEMO_NAMES = Object.keys(OAUTH_HTTP_DEMOS);

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
export function buildOAuthHostLaunch(name, demosRoot, env) {
    const demo = OAUTH_HTTP_DEMOS[name];
    if (!demo) {
        throw new Error(`Unknown oauth http demo: ${name}`);
    }
    if (!env[demo.oauthIdpUrlEnv]?.trim()) {
        env[demo.oauthIdpUrlEnv] = demo.defaultOAuthIdpUrl;
    }
    const port = resolvePort(demo, env);
    const hostJs = path.join(demosRoot, 'generated/cli/oauth-http-mcp-server.js');
    const toolsJs = path.join(demosRoot, 'generated/tools', demo.tools);
    const oauthScope = demo.oauthScope ?? name;
    const args = [
        hostJs,
        toolsJs,
        '--oauth-idp-url',
        env[demo.oauthIdpUrlEnv],
        '--oauth-scope',
        oauthScope,
        '--port',
        String(port),
        '--path',
        '/mcp'
    ];
    const mcpUrl = `http://127.0.0.1:${port}/mcp`;
    return { demo, port, args, mcpUrl };
}

export function listOAuthHttpPorts(env = process.env) {
    return OAUTH_HTTP_DEMO_NAMES.map((name) => resolvePort(OAUTH_HTTP_DEMOS[name], env));
}
