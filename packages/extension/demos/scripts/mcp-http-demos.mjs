/**
 * Relay HTTP MCP demo hosts (db2ai) — keys match .cursor/mcp.json server names.
 */
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { requireEnv, requireEnvInt } from './generated/require-env.mjs';

function loadProductName(demosRoot) {
    const config = JSON.parse(readFileSync(path.join(demosRoot, 'project-generate.config.json'), 'utf-8'));
    return config.productName;
}

export const HTTP_DEMOS = {
    pagila: {
        host: 'passthrough-http-mcp-server.js',
        tools: 'pagila-tools.js',
        connectionEnv: 'PAGILA_DATABASE_URL',
        portEnv: 'PAGILA_HTTP_PORT'
    }
};

/** Hosts started by `npm run start` (HTTP entries in .cursor/mcp.json). */
export const HTTP_START_DEMO_NAMES = ['pagila'];

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
    const port = requireEnvInt(demo.portEnv, env);
    const product = loadProductName(demosRoot);
    const hostJs = path.join(demosRoot, 'generated', product, 'cli', demo.host);
    const toolsJs = path.join(demosRoot, 'generated', product, 'tools', demo.tools);
    const args = [hostJs, toolsJs, '--port', String(port), '--path', '/mcp'];
    const mcpUrl = `http://127.0.0.1:${port}/mcp`;
    return { demo, port, args, mcpUrl };
}

export function listHttpPorts(env = process.env) {
    return HTTP_DEMO_NAMES.map((name) => requireEnvInt(HTTP_DEMOS[name].portEnv, env));
}
