#!/usr/bin/env node
/**
 * Stop processes listening on db2ai demo OAuth HTTP MCP ports.
 */
import { loadDemoEnvLocal } from './load-env-local.mjs';
import { killListenersOnPort } from './kill-listeners-on-port.mjs';
import { listOAuthHttpPorts } from './mcp-oauth-demos.mjs';

loadDemoEnvLocal();
for (const port of listOAuthHttpPorts()) {
    killListenersOnPort(port, { logPrefix: 'mcp-oauth:kill' });
}
