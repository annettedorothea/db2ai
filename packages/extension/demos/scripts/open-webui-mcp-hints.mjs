/**
 * Copy-paste hints for Open WebUI External Tools (HTTP MCP).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProjectEnvLocal } from './generated/load-env-local.mjs';
import { requireEnv } from './generated/require-env.mjs';
import { buildHostLaunch, HTTP_START_DEMO_NAMES } from './mcp-http-demos.mjs';
import { buildOAuthHostLaunch, OAUTH_HTTP_DEMOS, OAUTH_HTTP_START_DEMO_NAMES } from './mcp-oauth-demos.mjs';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ name: string, port: number, auth: string, url: string, headers?: string }[]}
 */
export function buildOpenWebUiHttpMcpEntries(env = process.env) {
    return HTTP_START_DEMO_NAMES.map((name) => {
        const { demo, port, mcpUrl } = buildHostLaunch(name, demosRoot, env);
        const entry = {
            name,
            port,
            auth: 'None',
            url: mcpUrl
        };
        if (demo.authExpectedEnv) {
            const headerName = demo.mcpAuthHeaderEnv ? requireEnv(demo.mcpAuthHeaderEnv, env) : 'x-api-token';
            const headerValue = requireEnv(demo.authExpectedEnv, env);
            entry.headers = JSON.stringify({ [headerName]: headerValue });
        }
        return entry;
    });
}

/**
 * @param {NodeJS.ProcessEnv} env
 */
export function buildOpenWebUiOAuthMcpEntries(env = process.env) {
    return OAUTH_HTTP_START_DEMO_NAMES.map((name) => {
        const demo = OAUTH_HTTP_DEMOS[name];
        const { port, mcpUrl } = buildOAuthHostLaunch(name, demosRoot, env);
        return {
            name,
            port,
            auth: 'OAuth 2.1',
            url: mcpUrl,
            clientId: 'mcp-demo-local',
            oauthServerUrl: requireEnv(demo.oauthIdpUrlEnv, env)
        };
    });
}

/**
 * @param {number} openWebUiPort
 * @param {NodeJS.ProcessEnv} env
 */
export function printOpenWebUiMcpHints(openWebUiPort, env = process.env) {
    loadProjectEnvLocal();
    const httpEntries = buildOpenWebUiHttpMcpEntries(env);
    const oauthEntries = buildOpenWebUiOAuthMcpEntries(env);

    console.log('');
    console.log('[open-webui] Admin Settings → External Tools → MCP (Streamable HTTP)');
    console.log('[open-webui] UI: http://127.0.0.1:' + openWebUiPort);
    console.log('[open-webui] All MCP URLs use 127.0.0.1 (native Open WebUI on the host).');
    console.log('[open-webui] Phase 1: Verify Connection — no LLM required.');
    console.log('');

    for (const entry of httpEntries) {
        console.log(`--- ${entry.name} (HTTP) ---`);
        console.log(`  URL:     ${entry.url}`);
        console.log(`  Auth:    ${entry.auth}`);
        if (entry.headers) {
            console.log(`  Headers: ${entry.headers}`);
        }
        console.log('');
    }

    for (const entry of oauthEntries) {
        console.log(`--- ${entry.name} (OAuth) ---`);
        console.log(`  URL:              ${entry.url}`);
        console.log(`  Auth:             ${entry.auth}`);
        console.log(`  Client ID:        ${entry.clientId}`);
        console.log(`  Client Secret:    demo (any placeholder — IdP uses public client, no secret check)`);
        console.log(`  OAuth Server URL: ${entry.oauthServerUrl}`);
        console.log(`  Note: per chat — Integrations (diamond icon beside +) → Tools; reload page if list empty; OAuth login alice/bob/admin.`);
        console.log('');
    }

    console.log('[open-webui] Phase 2 (chat): Admin → Connections → Groq or Ollama; Function Calling = Native.');
    console.log('[open-webui] Stop UI only: npm run open-webui:down');
    console.log('[open-webui] Stop demos + UI: npm run demo:kill-all && npm run open-webui:down');
}
