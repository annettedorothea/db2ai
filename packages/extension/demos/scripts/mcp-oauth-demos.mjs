/**
 * OAuth + stateful HTTP MCP demo hosts (db2ai).
 */
import path from 'node:path';

export const OAUTH_HTTP_DEMOS = {
    'orders-demo': {
        tools: 'orders-demo-tools.js',
        oauthIdpUrlEnv: 'ORDERS_DEMO_OAUTH_IDP_URL',
        defaultOAuthIdpUrl: 'http://127.0.0.1:3862',
        jwtSecretEnv: 'ORDERS_DEMO_JWT_SECRET',
        portEnv: 'ORDERS_DEMO_OAUTH_HTTP_PORT',
        defaultPort: 3871,
        mcpUrl: 'http://127.0.0.1:3871/mcp',
        prerequisite: 'orders-demo Postgres (db:orders-demo:up) + oauth-idp'
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
    const tokenValidation = (env.OAUTH_TOKEN_VALIDATION ?? 'hs256').trim();
    const args = [
        hostJs,
        toolsJs,
        '--oauth-idp-url',
        env[demo.oauthIdpUrlEnv],
        '--oauth-scope',
        name,
        '--oauth-token-validation',
        tokenValidation,
        '--port',
        String(port),
        '--path',
        '/mcp'
    ];
    if (tokenValidation === 'oidc') {
        const issuer = (env.OAUTH_ISSUER ?? env[demo.oauthIdpUrlEnv]).trim();
        args.push('--oauth-issuer', issuer);
        const audience = env.OAUTH_AUDIENCE?.trim();
        if (audience) {
            args.push('--oauth-audience', audience);
        }
    } else {
        args.push('--jwt-secret-env', demo.jwtSecretEnv);
    }
    return { demo, port, args, mcpUrl: demo.mcpUrl };
}

export function listOAuthHttpPorts(env = process.env) {
    return OAUTH_HTTP_DEMO_NAMES.map((name) => resolvePort(OAUTH_HTTP_DEMOS[name], env));
}
