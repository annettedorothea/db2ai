#!/usr/bin/env node
/**
 * Stop processes listening on demo HTTP and OAuth MCP ports.
 */
import { prepareWorkspaceEnv } from './start-shared.mjs';
import { killPortsFromDemoMaps } from '../generated/db2ai/scripts/kill-mcp-ports.mjs';
import { HTTP_DEMO_NAMES, HTTP_DEMOS } from './mcp-http-demos.mjs';
import { OAUTH_HTTP_DEMO_NAMES, OAUTH_HTTP_DEMOS } from './mcp-oauth-demos.mjs';

prepareWorkspaceEnv();

killPortsFromDemoMaps(HTTP_DEMOS, HTTP_DEMO_NAMES, 'mcp-http:kill');
killPortsFromDemoMaps(OAUTH_HTTP_DEMOS, OAUTH_HTTP_DEMO_NAMES, 'mcp-oauth:kill');
