#!/usr/bin/env node
/**
 * Stop processes listening on demo HTTP and OAuth MCP ports.
 * Missing port env vars are skipped (safe after partial .env or new demos).
 */
import { prepareWorkspaceEnv } from './start-shared.mjs';
import { optionalEnvInt } from './generated/require-env.mjs';
import { killListenersOnPort } from './generated/kill-listeners-on-port.mjs';
import { HTTP_DEMO_NAMES, HTTP_DEMOS } from './mcp-http-demos.mjs';
import { OAUTH_HTTP_DEMO_NAMES, OAUTH_HTTP_DEMOS } from './mcp-oauth-demos.mjs';

prepareWorkspaceEnv();

for (const name of HTTP_DEMO_NAMES) {
    const portEnv = HTTP_DEMOS[name].portEnv;
    const port = optionalEnvInt(portEnv);
    if (port === undefined) {
        console.warn(`[mcp-http:kill] skip ${name}: ${portEnv} not set`);
        continue;
    }
    killListenersOnPort(port, { logPrefix: 'mcp-http:kill' });
}
for (const name of OAUTH_HTTP_DEMO_NAMES) {
    const portEnv = OAUTH_HTTP_DEMOS[name].portEnv;
    const port = optionalEnvInt(portEnv);
    if (port === undefined) {
        console.warn(`[mcp-oauth:kill] skip ${name}: ${portEnv} not set`);
        continue;
    }
    killListenersOnPort(port, { logPrefix: 'mcp-oauth:kill' });
}
