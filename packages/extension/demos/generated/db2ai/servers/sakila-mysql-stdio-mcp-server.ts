#!/usr/bin/env node
/**
 * Generated MCP stdio host for sakila-mysql (static tools import).
 */
import * as tools from '../tools/sakila-mysql-tools.js';
import { defaultMcpEnvDirsFromMetaUrl, runStdioMcp } from '@toolfactory.dev/core/mcp-host';

await runStdioMcp(tools, process.argv.slice(2), defaultMcpEnvDirsFromMetaUrl(import.meta.url));
