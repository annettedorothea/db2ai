#!/usr/bin/env node
/**
 * Preflight for /test-all: ensure HTTP MCP ports from .cursor/mcp.json are listening.
 *
 * Usage: node ./scripts/check-mcp-ready.mjs
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const demosRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {number} port
 * @returns {boolean}
 */
function isPortListening(port) {
    try {
        const raw = execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, { encoding: 'utf8' }).trim();
        return raw.length > 0;
    } catch (err) {
        const status = err && typeof err === 'object' && 'status' in err ? err.status : undefined;
        if (status === 1) {
            return false;
        }
        throw err;
    }
}

/**
 * @param {string} url
 * @returns {number}
 */
function extractPortFromUrl(url) {
    const parsed = new URL(url);
    if (parsed.port) {
        return Number.parseInt(parsed.port, 10);
    }
    return parsed.protocol === 'https:' ? 443 : 80;
}

function main() {
    const mcpJsonPath = path.join(demosRoot, '.cursor/mcp.json');
    const config = JSON.parse(readFileSync(mcpJsonPath, 'utf-8'));
    const servers = config.mcpServers ?? {};
    /** @type {{ name: string; port: number; url: string }[]} */
    const missing = [];
    /** @type {string[]} */
    const stdioServers = [];

    for (const [name, entry] of Object.entries(servers)) {
        if (typeof entry?.url === 'string' && entry.url.trim()) {
            const port = extractPortFromUrl(entry.url.trim());
            if (!isPortListening(port)) {
                missing.push({ name, port, url: entry.url.trim() });
            }
            continue;
        }
        if (typeof entry?.command === 'string' && entry.command.trim()) {
            stdioServers.push(name);
        }
    }

    if (missing.length > 0) {
        console.error('[check-mcp-ready] HTTP MCP ports not listening:');
        for (const { name, port, url } of missing) {
            console.error(`  - ${name}: ${url} (port ${port})`);
        }
        console.error('[check-mcp-ready] Fix: npm run start:mcp (DBs/IdP running?) or npm run start:all.');
        process.exit(1);
    }

    if (stdioServers.length > 0) {
        console.warn(`[check-mcp-ready] stdio servers: ${stdioServers.join(', ')}`);
        console.warn('[check-mcp-ready] After build:generated, restart those MCP servers in Cursor.');
    }

    console.log('[check-mcp-ready] All HTTP MCP ports are listening.');
}

main();
