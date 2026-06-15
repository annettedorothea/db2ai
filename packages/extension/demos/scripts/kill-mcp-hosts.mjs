#!/usr/bin/env node
/**
 * Stop processes listening on demo HTTP and OAuth MCP ports.
 */
import { loadProjectEnvLocal } from './generated/load-env-local.mjs';
import { killListenersOnPort } from './generated/kill-listeners-on-port.mjs';
import { listHttpPorts } from './mcp-http-demos.mjs';
import { listOAuthHttpPorts } from './mcp-oauth-demos.mjs';

loadProjectEnvLocal();
for (const port of listHttpPorts()) {
    killListenersOnPort(port, { logPrefix: 'mcp-http:kill' });
}
for (const port of listOAuthHttpPorts()) {
    killListenersOnPort(port, { logPrefix: 'mcp-oauth:kill' });
}
