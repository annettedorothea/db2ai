#!/usr/bin/env node
/**
 * Generated MCP stdio host for orders-postgresql (static tools import).
 */
import * as tools from '../tools/orders-postgresql-tools.js';
import { defaultMcpEnvDirsFromMetaUrl, runStdioMcp } from '@toolfactory.dev/core/mcp-host';

await runStdioMcp(tools, process.argv.slice(2), defaultMcpEnvDirsFromMetaUrl(import.meta.url));
