/**
 * OAuth + stateful HTTP MCP demo hosts (db2ai).
 */
import path from 'node:path';

export const OAUTH_HTTP_DEMOS = {
    'access-demo': {
        tools: 'access-demo-tools.js',
        oauthIdpUrlEnv: 'ACCESS_DEMO_OAUTH_IDP_URL',
        defaultOAuthIdpUrl: 'http://127.0.0.1:3862',
        jwtSecretEnv: 'ACCESS_DEMO_JWT_SECRET',
        portEnv: 'ACCESS_DEMO_OAUTH_HTTP_PORT',
        defaultPort: 3871,
        mcpUrl: 'http://127.0.0.1:3871/mcp',
        prerequisite: 'access-demo Docker + oauth-idp (db:access-demo:up, demo:oauth-idp)'
    }
};

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
    const args = [
        hostJs,
        toolsJs,
        '--oauth-idp-url',
        env[demo.oauthIdpUrlEnv],
        '--jwt-secret-env',
        demo.jwtSecretEnv,
        '--port',
        String(port),
        '--path',
        '/mcp'
    ];
    return { demo, port, args, mcpUrl: demo.mcpUrl };
}
