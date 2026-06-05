#!/usr/bin/env node
/**
 * Stop processes listening on db2ai demo HTTP MCP ports.
 */
import { loadDemoEnvLocal } from './load-env-local.mjs';
import { killListenersOnPort } from './kill-listeners-on-port.mjs';
import { listHttpPorts } from './mcp-http-demos.mjs';

loadDemoEnvLocal();
for (const port of listHttpPorts()) {
    killListenersOnPort(port, { logPrefix: 'mcp-http:kill' });
}
