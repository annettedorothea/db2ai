/**
 * OAuth HTTP MCP demo hosts (db2ai) — keys match .cursor/mcp.json server names.
 */
import path from 'node:path';
import { requireEnv, requireEnvInt } from './generated/require-env.mjs';

export const OAUTH_HTTP_DEMOS = {
    orders: {
        tools: 'orders-postgres-tools.js',
        connectionEnv: 'ORDERS_POSTGRES_DATABASE_URL',
        oauthIdpUrlEnv: 'ORDERS_POSTGRES_OAUTH_IDP_URL',
        portEnv: 'ORDERS_POSTGRES_OAUTH_HTTP_PORT',
        oauthScope: 'orders-postgres',
        mcpServerName: 'orders'
    }
};

/** OAuth MCP hosts started by `npm run start`. */
export const OAUTH_HTTP_START_DEMO_NAMES = ['orders'];

export const OAUTH_HTTP_DEMO_NAMES = Object.keys(OAUTH_HTTP_DEMOS);

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
    requireEnv(demo.connectionEnv, env);
    const oauthIdpUrl = requireEnv(demo.oauthIdpUrlEnv, env);
    const port = requireEnvInt(demo.portEnv, env);
    const hostJs = path.join(demosRoot, 'generated/cli/oauth-http-mcp-server.js');
    const toolsJs = path.join(demosRoot, 'generated/tools', demo.tools);
    const oauthScope = demo.oauthScope ?? name;
    const args = [
        hostJs,
        toolsJs,
        '--oauth-idp-url',
        oauthIdpUrl,
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
    return OAUTH_HTTP_DEMO_NAMES.map((name) => requireEnvInt(OAUTH_HTTP_DEMOS[name].portEnv, env));
}
