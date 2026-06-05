/**
 * OAuth HTTP MCP demo hosts (db2ai) — keys match .cursor/mcp.json server names.
 */
import path from 'node:path';

export const OAUTH_HTTP_DEMOS = {
    orders: {
        tools: 'orders-demo-tools.js',
        oauthIdpUrlEnv: 'ORDERS_DEMO_OAUTH_IDP_URL',
        defaultOAuthIdpUrl: 'http://127.0.0.1:4863',
        portEnv: 'ORDERS_DEMO_OAUTH_HTTP_PORT',
        defaultPort: 4871,
        tokenValidation: 'oidc',
        oauthScope: 'orders-demo',
        mcpServerName: 'orders',
        prerequisite: 'Docker orders-demo + oauth-idp :4863 (RS256)'
    }
};

/** OAuth MCP hosts started by `npm run init`. */
export const OAUTH_HTTP_INIT_DEMO_NAMES = ['orders'];

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
    const tokenValidation = demo.tokenValidation;
    const oauthScope = demo.oauthScope ?? name;
    const args = [
        hostJs,
        toolsJs,
        '--oauth-idp-url',
        env[demo.oauthIdpUrlEnv],
        '--oauth-scope',
        oauthScope,
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
    }
    const mcpUrl = `http://127.0.0.1:${port}/mcp`;
    return { demo, port, args, mcpUrl, tokenValidation };
}

export function listOAuthHttpPorts(env = process.env) {
    return OAUTH_HTTP_DEMO_NAMES.map((name) => resolvePort(OAUTH_HTTP_DEMOS[name], env));
}
